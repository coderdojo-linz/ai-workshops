terraform {
  backend "azurerm" {
    resource_group_name  = "oai"
    storage_account_name = "stopentofuaiworkshops"
    container_name       = "opentofu"
    key                  = "prod.terraform.tfstate"
  }
  required_providers {
    azapi = {
      source = "azure/azapi"
    }
  }
}

provider "azurerm" {
  subscription_id = var.subscription_id
  features {
  }
}

provider "azapi" {}

locals {
  roles = jsondecode(file("${path.module}/azure-roles.json"))
}

resource "azurerm_user_assigned_identity" "oai-identity" {
  location            = var.location
  name                = var.identity_name
  resource_group_name = var.resource_group_name
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "oai-log" {
  name                = "log${var.resource_group_name}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

data "azurerm_subscription" "subscription" {}

data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

# Azure Container Registry
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "Standard"
}

resource "azurerm_role_assignment" "acr-role-assignment" {
  scope              = azurerm_container_registry.acr.id
  principal_id       = azurerm_user_assigned_identity.oai-identity.principal_id
  principal_type     = "ServicePrincipal"
  role_definition_id = "${data.azurerm_subscription.subscription.id}/providers/Microsoft.Authorization/roleDefinitions/${local.roles["AcrPull"]}"
}

resource "azurerm_storage_account" "oai-config" {
  name                     = var.storage_account_name
  resource_group_name      = data.azurerm_resource_group.rg.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_share" "oai-config-storage-share" {
  name               = "openwebui"
  storage_account_id = azurerm_storage_account.oai-config.id
  quota              = 50
}

# Container Apps Environment
resource "azurerm_container_app_environment" "oai-cae" {
  name                       = var.containerapps_env_name
  location                   = var.location
  resource_group_name        = data.azurerm_resource_group.rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.oai-log.id
  logs_destination           = "log-analytics"
  workload_profile {
    name                  = "Consumption"
    workload_profile_type = "Consumption"
  }
}

resource "azurerm_container_app_environment_storage" "oai-cae-storage" {
  name                         = var.storage_account_name
  container_app_environment_id = azurerm_container_app_environment.oai-cae.id
  account_name                 = azurerm_storage_account.oai-config.name
  share_name                   = azurerm_storage_share.oai-config-storage-share.name
  access_key                   = azurerm_storage_account.oai-config.primary_access_key
  access_mode                  = "ReadWrite"
}

resource "azurerm_container_app" "oai-open-webui" {
  name                         = "oai-open-webui"
  resource_group_name          = data.azurerm_resource_group.rg.name
  container_app_environment_id = azurerm_container_app_environment.oai-cae.id
  revision_mode                = "Single"
  template {
    container {
      name   = "oai-open-webui"
      image  = "ghcr.io/open-webui/open-webui:main"
      cpu    = 1.0
      memory = "2Gi"
      volume_mounts {
        name = "oai-config"
        path = "/app/backend/data"
      }
      env {
        name = "MICROSOFT_CLIENT_TENANT_ID"
        value = "022e4faf-c745-475a-be06-06b1e1c9e39d"
      }
      env {
        name = "MICROSOFT_CLIENT_ID"
        value = "1bd458df-dc47-42b9-bdea-5baccfa85f06"
      }
      env {
        name = "MICROSOFT_CLIENT_SECRET"
        value = "<add your secret here>"
      }
      env {
        name = "MICROSOFT_REDIRECT_URI"
        value = "https://something/microsoft/callback"
      }
      env {
        name = "OAUTH_MERGE_ACCOUNTS_BY_EMAIL"
        value = "true"
      }
      env {
        name = "WEBUI_URL"
        value = "https://something"
      }
      env {
        name = "OAUTH_REDIRECT_URI"
        value = "https://something/microsoft/callback"
      }
      env {
        name = "ENABLE_OAUTH_SIGNUP"
        value = "true"
      }
    }
    volume {
      name = "oai-config"
      storage_type = "AzureFile"
      storage_name = azurerm_container_app_environment_storage.oai-cae-storage.name
    }
  }
  ingress {
    target_port      = 8080
    external_enabled = true
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

resource "azapi_resource_action" "sticky_session" {
  count       = var.sticky_sessions_affinity ? 1 : 0
  type        = "Microsoft.App/containerApps@2023-11-02-preview"
  resource_id = azurerm_container_app.oai-open-webui.id
  method      = "PATCH"
  body = {
    properties = {
      configuration = {
        ingress = {
          stickySessions = {
            affinity = "sticky"
          }
        }
      }
    }
  }

  depends_on = [
    azurerm_container_app.oai-open-webui,
  ]
}

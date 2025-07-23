variable "location" {
  type    = string
  default = "swedencentral"
}

variable "resource_group_name" {
  type    = string
  default = "oai"
}

variable "subscription_id" {
  type    = string
  default = "b33f0285-db27-4896-ac5c-df22004b0aba"
}

variable "containerapps_env_name" {
  type    = string
  default = "caeoai"
}

variable "acr_name" {
  type    = string
  default = "croai"
}

variable "identity_name" {
  type    = string
  default = "idoai"
}

# see also https://github.com/hashicorp/terraform-provider-azurerm/issues/24757
variable "sticky_sessions_affinity" {
  description = "The sticky session affinity boolean to enable or disable sticky session."
  type        = bool
  default     = true
}

variable "storage_account_name" {
  type    = string
  default = "stoaiconfig"
}
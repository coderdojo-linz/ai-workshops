param siteName string

@secure()
param jwtSecret string

@secure()
param sessionSecret string

resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: 'web-apps-sweden-central'
  location: 'swedencentral'
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2024-01-01' existing = {
  name: 'stoaiconfig'
}

resource webApp 'Microsoft.Web/sites@2024-04-01' = {
  name: siteName
  location: 'swedencentral'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'SITECONTAINERS'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      minimumElasticInstanceCount: 1
    }
  }

  resource settings 'config@2024-04-01' = {
    name: 'appsettings'
    properties: {
      DEFAULT_LOCALE: 'en'
      JWT_SECRET: jwtSecret
      SESSION_SECRET: sessionSecret
      PROXY_TARGET: 'http://localhost:8080'
      WEBUI_URL: 'https://${siteName}.azurewebsites.net'
      WEBUI_AUTH_TRUSTED_EMAIL_HEADER: 'X-User-Email'
      WEBUI_AUTH_TRUSTED_NAME_HEADER: 'X-User-Name'
      WEBUI_AUTH_TRUSTED_GROUPS_HEADER: 'X-User-Groups'
    }
  }

  resource storageSetting 'config@2024-11-01' = {
    name: 'azurestorageaccounts'
    properties: {
      config: {
        type: 'AzureFiles'
        shareName: 'openwebui'
        mountPath: '/app/backend/data'
        accountName: storageAccount.name
        accessKey: storageAccount.listKeys().keys[0].value
      }
      users: {
        type: 'AzureFiles'
        shareName: 'users'
        mountPath: '/app/data'
        accountName: storageAccount.name
        accessKey: storageAccount.listKeys().keys[0].value
      }
    }
  }
}

resource registry 'Microsoft.ContainerRegistry/registries@2024-11-01-preview' existing = {
  name: 'acrars2025'
}

resource registryPullAssignmentManagedIdentity 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(registry.id, webApp.name, '-pull')
  scope: registry
  properties: {
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
  }
}

resource autoProxyApp 'Microsoft.Web/sites/sitecontainers@2024-11-01' = {
  name: 'auth-proxy'
  parent: webApp
  properties: {
    image: 'acrars2025.azurecr.io/openwebui-auth-proxy:latest'
    authType: 'SystemIdentity'
    isMain: true
    targetPort: '3000'
    inheritAppSettingsAndConnectionStrings: true
    environmentVariables: [
      {
        name: 'PROXY_TARGET'
        value: 'PROXY_TARGET'
      }
      {
        name: 'JWT_SECRET'
        value: 'JWT_SECRET'
      }
      {
        name: 'SESSION_SECRET'
        value: 'SESSION_SECRET'
      }
    ]
    // volumeMounts: [
    //   {
    //     volumeSubPath: '/app/data'
    //     containerMountPath: '/app/data'
    //   }
    // ]
  }

  dependsOn: [
    registryPullAssignmentManagedIdentity
  ]
}


resource openwebuiApp 'Microsoft.Web/sites/sitecontainers@2024-11-01' = {
  name: 'open-webui'
  parent: webApp
  properties: {
    image: 'ghcr.io/open-webui/open-webui:main'
    isMain: false
    inheritAppSettingsAndConnectionStrings: true
    environmentVariables: [
      {
        name: 'WEBUI_URL'
        value: 'WEBUI_URL'
      }
      {
        name: 'DEFAULT_LOCALE'
        value: 'DEFAULT_LOCALE'
      }
      {
        name: 'WEBUI_AUTH_TRUSTED_EMAIL_HEADER'
        value: 'WEBUI_AUTH_TRUSTED_EMAIL_HEADER'
      }
      {
        name: 'WEBUI_AUTH_TRUSTED_NAME_HEADER'
        value: 'WEBUI_AUTH_TRUSTED_NAME_HEADER'
      }
      {
        name: 'WEBUI_AUTH_TRUSTED_GROUPS_HEADER'
        value: 'WEBUI_AUTH_TRUSTED_GROUPS_HEADER'
      }
    ]
    // volumeMounts: [
    //   {
    //     volumeSubPath: '/app/backend/data'
    //     containerMountPath: '/app/backend/data'
    //   }
    // ]
  }

  dependsOn: [
    autoProxyApp
  ]
}

const config = {
  frontend: {
    tenantProxyPath: 'http://localhost:8032',
    apiPath: 'api/',
    basePath: '/',
    showDeveloper: true,
    showInnkeeperReservationPassword: true,
    showInnkeeperAdminLogin: true,
    oidc: {
      active: false,
      authority:
        'https://manager.credence.ng',
      client: 'innkeeper-frontend',
      label: 'CREDA',
    },
    ux: {
      appTitle: 'Credence Tenant Console',
      appInnkeeperTitle: 'Traction Innkeeper Console',
      sidebarTitle: 'CREDENCE',
      copyright: 'Credence (c) 2024',
      owner: 'Credence',
      coverImageCopyright: 'Unknown',
      aboutBusiness: {
        title: 'Credence Platform',
        linkTitle: 'Credence Service Agreement',
        link: 'https://github.com/bcgov/bc-vcpedia/blob/main/agents/bc-gov-agent-service.md',
        imageUrl: '/img/bc/bc_logo.png',
      },
    },
  },
  image: {
    buildtime: '',
    tag: 'tenant-ui:default',
    version: 'default',
  },
  server: {
    tractionUrl: 'http://localhost:5100',
  },
};

const plugins = {
  result: [
    'aries_cloudagent.holder',
    'aries_cloudagent.ledger',
    'aries_cloudagent.messaging.credential_definitions',
  ],
};

function setTenantProxyUrl(url: string) {
  config.frontend.tenantProxyPath = url;
}

export default {
  config,
  plugins,
  setTenantProxyUrl,
};

// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';
import remarkGithubAlerts from 'remark-github-blockquote-alert';

const fs = require('fs');
const path = require('path');
const repos = JSON.parse(fs.readFileSync('./repos.json', 'utf8'));

const docsPlugins = repos.map(repo => [
  '@docusaurus/plugin-content-docs',
  {
    id: repo.name,
    path: repo.target_path,
    routeBasePath: `page/${repo.name}`,
    sidebarPath: require.resolve('./sidebars.js'),
  },
]);

const navbarItems = repos.map(repo => ({
  to: `/page/${repo.name}`,
  label: repo.name.charAt(0).toUpperCase() + repo.name.slice(1).replace(/-/g, ' '),
  position: 'left',
}));

const searchPaths = repos.map(repo => `page/${repo.name}`);

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Lab Notes: Yosafat Marselino',
  tagline: 'BMW: Lab Notes',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://bmw.ece.ntust.edu.tw',
  baseUrl: '/docs/',

  organizationName: 'facebook',
  projectName: 'docusaurus',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    ...docsPlugins,  // ADD THIS - spread the dynamic plugins
    'docusaurus-plugin-image-zoom',
    [
      '@docusaurus/plugin-ideal-image',
      {
        quality: 85,
        max: 2000,
        min: 500,
        steps: 4,
        disableInDev: false,
      },
    ],
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexBlog: false,  // Changed to false since blog is disabled
        docsRouteBasePath: searchPaths,
        docsPluginIdForPreferredVersion: repos.length > 0 ? repos[0].name : undefined,
      },
    ],
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: false,
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      zoom: {
        selector: '.markdown :not(em) > img',
        background: {
          light: 'rgba(255, 255, 255, 0.95)',
          dark: 'rgba(50, 50, 50, 0.95)'
        },
        config: {
          margin: 24,
          scrollOffset: 0,
        }
      },
      navbar: {
        logo: {
          alt: 'Logo',
          src: 'img/logo.png',
        },
        items: [
          ...navbarItems,  // Use dynamic navbar items from repos.json
          // Remove hardcoded links to /blog, /pages, /guides if they don't exist
        ],
      },
      footer: {
        style: 'dark',
        links: [
          // Remove or update footer links
        ],
        copyright: `Copyright © ${new Date().getFullYear()} OSC Asia Pasific Lab. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;

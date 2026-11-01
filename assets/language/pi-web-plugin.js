import catalogs from './catalogs.js';

// A variant (not a private-use suffix): the host matches locale base names.
export const locale = 'en-grimoire';

export default {
  apiVersion: 5,
  name: 'Grimoire / Wizardly English',
  activate({ localization }) {
    if (localization === undefined) {
      throw new Error('Wizardly English requires a PI WEB host with localization support. The Grimoire CSS themes can still be used independently.');
    }
    for (const [namespace, catalog] of Object.entries(catalogs)) {
      // The host owns registration cleanup when this plugin is deactivated.
      localization.registerCatalog({
        id: namespace,
        namespace,
        locale,
        async load() { return catalog; },
      });
    }
    return { contributions: {} };
  },
};

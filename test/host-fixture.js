// Real PI WEB shell components, isolated from the app runtime and session daemon.
import { AppMobileMainTabs } from 'host/components/appShell/AppMobileMainTabs';
import { WorkspacePanel } from 'host/components/WorkspacePanel';
import { pluginStyles } from 'host/plugins/styles';
import { html } from 'lit';

const style = document.createElement('style');
style.textContent = 'body { margin: 0; background: var(--pi-bg); color: var(--pi-text); } main { min-width: 0; } workspace-panel { display: block; height: 400px; }';
document.head.append(style);
pluginStyles.registerRoot(document);
const main = document.createElement('main');
const tabs = new AppMobileMainTabs();
tabs.tabs = ['Sessions', 'Chat', 'Files', 'Terminal', 'Git', 'Notices'].map((label, i) => ({ id: i === 1 ? 'chat' : `fixture:${i}`, label }));
tabs.onSelect = id => { tabs.selectedTab = id; };
tabs.onShowNavigation = () => { main.dataset.navigation = 'open'; };
const workspace = new WorkspacePanel();
workspace.panels = ['Files', 'Terminal', 'Git', 'Notices', 'Updates'].map((title, i) => ({ id: `fixture:${i}`, title, render: () => html`<p>${title} panel</p>` }));
workspace.pinnedIds = workspace.panels.map(panel => panel.id);
workspace.onSelectTool = id => { workspace.tool = id; };
workspace.onShowNavigation = () => { main.dataset.navigation = 'open'; };
workspace.onTogglePanel = () => { main.dataset.collapsed = 'true'; };
main.append(tabs, workspace);
document.body.append(main);
await Promise.all([tabs.updateComplete, workspace.updateComplete]);
window.fixture = {
  async theme(theme) {
    await pluginStyles.setTheme(theme.stylesheets.map(sheet => ({
      id: `grimoire:${theme.id}:${sheet.id}`, order: sheet.order,
      url: new URL(`assets/${sheet.path}`, document.baseURI).href,
    })), () => { document.documentElement.style.colorScheme = theme.colorScheme; });
  },
  clear() { pluginStyles.clearTheme(() => { document.documentElement.style.colorScheme = ''; }); },
};

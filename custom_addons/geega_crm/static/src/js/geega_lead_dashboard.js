/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, useState } from "@odoo/owl";
import { OriginalLeadsPage } from "./pages/original_leads_page";
import { ComingSoonPage } from "./pages/coming_soon_page";

export class GeegaLeadDashboard extends Component {
    static template = "geega_crm.LeadDashboard";
    static components = { OriginalLeadsPage, ComingSoonPage };

    setup() {
        this.actionService = useService("action");

        this.state = useState({
            // Sidebar sections open/close
            sections: {
                lead_center: true,
            },
            // Currently active menu item — default to Original Leads
            activeMenu: "original_leads",
            // Open tabs (ordered list)
            openTabs: [
                { id: "original_leads", name: "Original Leads" },
            ],
        });

        // Menu name lookup for tab labels
        this.menuNames = {};

        // Sidebar menu configuration
        this.sidebarConfig = [
            {
                id: "lead_center",
                name: "Lead Center",
                icon: "fa-bullseye",
                items: [
                    { id: "original_leads", name: "Original Leads", icon: "fa-list" },
                    { id: "leads_mgmt", name: "Leads Mgmt", icon: "fa-cogs" },
                ],
            },
        ];

        // Build menu name lookup
        for (const section of this.sidebarConfig) {
            for (const item of section.items) {
                this.menuNames[item.id] = item.name;
            }
        }
    }

    toggleSection(sectionId) {
        this.state.sections[sectionId] = !this.state.sections[sectionId];
    }

    onMenuClick(menuId) {
        // Set active menu
        this.state.activeMenu = menuId;

        // Add tab if not already open
        const tabExists = this.state.openTabs.some((t) => t.id === menuId);
        if (!tabExists) {
            this.state.openTabs.push({
                id: menuId,
                name: this.menuNames[menuId] || menuId,
            });
        }
    }

    onTabClick(tabId) {
        this.state.activeMenu = tabId;
    }

    onTabClose(tabId) {
        // Don't close if it's the only tab
        if (this.state.openTabs.length <= 1) return;

        const idx = this.state.openTabs.findIndex((t) => t.id === tabId);
        this.state.openTabs.splice(idx, 1);

        // If we closed the active tab, switch to the last tab
        if (this.state.activeMenu === tabId) {
            const lastTab = this.state.openTabs[this.state.openTabs.length - 1];
            this.state.activeMenu = lastTab.id;
        }
    }

    /**
     * Get the display name for a given menuId
     */
    getMenuName(menuId) {
        return this.menuNames[menuId] || menuId;
    }
}

registry.category("actions").add("geega_crm.lead_dashboard", GeegaLeadDashboard);

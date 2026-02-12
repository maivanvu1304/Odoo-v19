/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, useState } from "@odoo/owl";
import { WorkbenchPage } from "./pages/workbench_page";
import { ComingSoonPage } from "./pages/coming_soon_page";
import { TenderPage } from "./pages/tender_page";

export class GeegaSalesDashboard extends Component {
    static template = "geega_crm.SalesDashboard";
    static components = { WorkbenchPage, ComingSoonPage, TenderPage };

    setup() {
        this.orm = useService("orm");
        this.actionService = useService("action");

        this.state = useState({
            // Sidebar sections open/close
            sections: {
                business_center: true,
                test_drive_center: false,
                booking_center: false,
                customer_center: false,
                report_center: false,
            },
            // Currently active menu item
            activeMenu: "workbench",
            // Open tabs (ordered list)
            openTabs: [
                { id: "workbench", name: "Workbench" },
            ],
        });

        // Menu name lookup for tab labels
        this.menuNames = {};

        // Sidebar menu configuration
        this.sidebarConfig = [
            {
                id: "business_center",
                name: "Business Center",
                icon: "fa-briefcase",
                items: [
                    { id: "workbench", name: "Workbench", icon: "fa-desktop" },
                    { id: "dashboard", name: "Dashboard", icon: "fa-tachometer" },
                    { id: "insurance_analysis", name: "Insurance Analysis", icon: "fa-shield" },
                    { id: "todo_tasks", name: "To-do Tasks", icon: "fa-check-square-o" },
                    { id: "notification_records", name: "Notification Records", icon: "fa-bell" },
                    { id: "tender_approval", name: "Tender & Approval Center", icon: "fa-gavel" },
                ],
            },
            {
                id: "test_drive_center",
                name: "Test Drive Center",
                icon: "fa-car",
                items: [
                    { id: "test_drive_order", name: "Test Drive Order", icon: "fa-file-text-o" },
                    { id: "test_drive_mgmt", name: "Test Drive Mgmt", icon: "fa-cogs" },
                ],
            },
            {
                id: "booking_center",
                name: "Booking Center",
                icon: "fa-calendar",
                items: [
                    { id: "booking_mgmt", name: "Booking Mgmt", icon: "fa-calendar-check-o" },
                    { id: "order_mgmt", name: "Order Mgmt", icon: "fa-shopping-cart" },
                    { id: "finance_tracking", name: "Finance Tracking", icon: "fa-line-chart" },
                ],
            },
            {
                id: "customer_center",
                name: "Customer Center",
                icon: "fa-users",
                items: [
                    { id: "customer_list", name: "Customer List", icon: "fa-address-book" },
                    { id: "customer_analysis", name: "Customer Analysis", icon: "fa-pie-chart" },
                ],
            },
            {
                id: "report_center",
                name: "Report Center",
                icon: "fa-bar-chart",
                items: [
                    { id: "sales_report", name: "Sales Report", icon: "fa-file-text" },
                    { id: "performance_report", name: "Performance Report", icon: "fa-area-chart" },
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

registry.category("actions").add("geega_crm.sales_dashboard", GeegaSalesDashboard);

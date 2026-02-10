/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, useState, onWillStart } from "@odoo/owl";

export class GeegaSalesDashboard extends Component {
    static template = "geega_crm.SalesDashboard";

    setup() {
        this.orm = useService("orm");
        this.actionService = useService("action");

        this.state = useState({
            // Sidebar sections open/close
            sections: {
                business_center: true,
                test_drive_center: true,
                booking_center: true,
                customer_center: false,
                report_center: false,
            },
            // Currently active menu item
            activeMenu: "workbench",
            // Dashboard KPI data
            kpi: {
                totalContractValue: "0",
                totalActiveLeads: 0,
                totalActiveTenders: 0,
                winRate: "0",
                paymentCompletionRate: "0",
            },
            // Summary cards
            summary: {
                totalLeads: 0,
                totalLeadsChange: 0,
                activeCustomers: 0,
                activeCustomersChange: 0,
                totalRevenue: "0",
                totalRevenueChange: 0,
            },
        });

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

        onWillStart(async () => {
            await this.loadDashboardData();
        });
    }

    async loadDashboardData() {
        try {
            // Get total leads count
            const leads = await this.orm.searchCount("crm.lead", []);

            // Get active leads (not in folded stages)
            const activeLeads = await this.orm.searchCount("crm.lead", [
                ["stage_id.fold", "=", false],
            ]);

            // Get leads in tender stages
            const tenderLeads = await this.orm.searchCount("crm.lead", [
                ["stage_id.name", "in", ["Tender Submission", "Tender Evaluation"]],
            ]);

            // Get won leads
            const wonLeads = await this.orm.searchCount("crm.lead", [
                ["stage_id.name", "=", "Converted to Customer"],
            ]);

            // Get unique partners from leads
            const partners = await this.orm.readGroup(
                "crm.lead",
                [["partner_name", "!=", false]],
                ["partner_name"],
                ["partner_name"]
            );

            // Calculate KPIs
            const winRate = leads > 0 ? ((wonLeads / leads) * 100).toFixed(1) : "0";
            const totalValue = leads * 1850; // Simulated value per lead

            this.state.kpi = {
                totalContractValue: this.formatCurrency(totalValue),
                totalActiveLeads: activeLeads,
                totalActiveTenders: tenderLeads,
                winRate: winRate,
                paymentCompletionRate: "92.1",
            };

            this.state.summary = {
                totalLeads: leads,
                totalLeadsChange: 12,
                activeCustomers: partners.length,
                activeCustomersChange: 8,
                totalRevenue: this.formatCurrency(totalValue * 0.65),
                totalRevenueChange: 15,
            };
        } catch (e) {
            console.warn("GeegaSalesDashboard: Could not load KPI data", e);
        }
    }

    formatCurrency(value) {
        if (value >= 1000000) {
            return `USD ${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return `$${value}`;
    }

    toggleSection(sectionId) {
        this.state.sections[sectionId] = !this.state.sections[sectionId];
    }

    onMenuClick(menuId) {
        this.state.activeMenu = menuId;
        // For now, all items show the workbench dashboard
        // Future: navigate to specific views via doAction
    }

    isSectionOpen(sectionId) {
        return this.state.sections[sectionId];
    }

    isMenuActive(menuId) {
        return this.state.activeMenu === menuId;
    }
}

registry.category("actions").add("geega_crm.sales_dashboard", GeegaSalesDashboard);

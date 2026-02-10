/** @odoo-module **/

import { registry } from "@web/core/registry";
import { listView } from "@web/views/list/list_view";
import { ListController } from "@web/views/list/list_controller";
import { useService } from "@web/core/utils/hooks";
import { Component, useState, onWillStart } from "@odoo/owl";

export class GeegaListController extends ListController {
    static template = "geega_crm.GeegaListView";

    setup() {
        super.setup();
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.menuService = useService("menu");

        this.geegaState = useState({
            stages: [],
            activeStageId: null,
            searchLeadName: "",
            searchCustomerName: "",
            searchPhone: "",
            sidebarOpen: true,
        });

        // Sidebar menu configuration
        this.sidebarMenus = [
            { id: "original_leads", name: "Original leads", xmlid: "geega_crm.action_geega_crm_original_leads" },
            { id: "leads_mgmt", name: "Leads Mgmt", xmlid: "geega_crm.action_geega_crm_leads_mgmt" },
        ];

        onWillStart(async () => {
            await this.loadStages();
        });
    }

    async loadStages() {
        const stages = await this.orm.searchRead(
            "crm.stage",
            [],
            ["id", "name"],
            { order: "sequence" }
        );
        this.geegaState.stages = stages;
    }

    onStageClick(stageId) {
        this.geegaState.activeStageId = stageId;
        this.applyFilters();
    }

    onStageAllClick() {
        this.geegaState.activeStageId = null;
        this.applyFilters();
    }

    toggleSidebar() {
        this.geegaState.sidebarOpen = !this.geegaState.sidebarOpen;
    }

    async onSidebarMenuClick(xmlid) {
        await this.actionService.doAction(xmlid);
    }

    onSearchInputChange(field, ev) {
        this.geegaState[field] = ev.target.value;
    }

    onSearchKeydown(ev) {
        if (ev.key === "Enter") {
            this.onSearchClick();
        }
    }

    onSearchClick() {
        this.applyFilters();
    }

    onResetClick() {
        this.geegaState.searchLeadName = "";
        this.geegaState.searchCustomerName = "";
        this.geegaState.searchPhone = "";
        this.geegaState.activeStageId = null;
        this.applyFilters();
    }

    applyFilters() {
        const domain = [];

        if (this.geegaState.activeStageId) {
            domain.push(["stage_id", "=", this.geegaState.activeStageId]);
        }
        if (this.geegaState.searchLeadName) {
            domain.push(["name", "ilike", this.geegaState.searchLeadName]);
        }
        if (this.geegaState.searchCustomerName) {
            domain.push(["partner_name", "ilike", this.geegaState.searchCustomerName]);
        }
        if (this.geegaState.searchPhone) {
            domain.push(["phone", "ilike", this.geegaState.searchPhone]);
        }

        this.env.searchModel.setDomainParts({
            geegaFilters: {
                domain: domain,
                facetLabel: domain.length ? "Geega Filter" : "",
            },
        });
    }

    async onExportClick() {
        const records = this.model.root.records;
        if (!records.length) return;

        // Build CSV content
        const headers = [
            "Lead Name", "Company Name", "Phone Number", "Email",
            "Source Lead", "Intended Car", "Intended Level",
            "Follow-up Person", "Department",
            "Last Follow-up Date", "Next Contact Date"
        ];
        const fields = [
            "name", "partner_name", "phone", "email_from",
            "source_lead", "intended_car", "intended_level",
            "follow_up_person", "department",
            "last_followup_date", "next_contact_date"
        ];

        let csv = headers.join(",") + "\n";
        for (const record of records) {
            const row = fields.map((f) => {
                let val = record.data[f];
                if (val && typeof val === "object" && val.display_name) {
                    val = val.display_name;
                }
                if (val === false || val === undefined || val === null) {
                    val = "";
                }
                val = String(val).replace(/"/g, '""');
                return `"${val}"`;
            });
            csv += row.join(",") + "\n";
        }

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "geega_leads_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const geegaListView = {
    ...listView,
    Controller: GeegaListController,
    buttonTemplate: "geega_crm.GeegaListView.Buttons",
};

registry.category("views").add("geega_list", geegaListView);

/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class OriginalLeadsPage extends Component {
    static template = "geega_crm.OriginalLeadsPage";

    setup() {
        this.orm = useService("orm");
        this.actionService = useService("action");

        this.state = useState({
            leads: [],
            stages: [],
            activeStageId: null,
            selectedIds: [],
            selectAll: false,
            // Search fields
            searchLeadName: "",
            searchCustomerName: "",
            searchPhone: "",
            // Pagination
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
        });

        onWillStart(async () => {
            await this.loadStages();
            await this.loadLeads();
        });
    }

    // ─── Stage Tabs ───────────────────────────────────────
    async loadStages() {
        try {
            const stages = await this.orm.searchRead(
                "crm.stage",
                [],
                ["id", "name"],
                { order: "sequence" }
            );
            this.state.stages = stages;
        } catch (e) {
            console.warn("OriginalLeadsPage: Could not load stages", e);
        }
    }

    onStageClick(stageId) {
        this.state.activeStageId = stageId;
        this.state.currentPage = 1;
        this.loadLeads();
    }

    onStageAllClick() {
        this.state.activeStageId = null;
        this.state.currentPage = 1;
        this.loadLeads();
    }

    // ─── Load Leads ───────────────────────────────────────
    async loadLeads() {
        try {
            const domain = [["type", "=", "lead"]];

            // Stage filter
            if (this.state.activeStageId) {
                domain.push(["stage_id", "=", this.state.activeStageId]);
            }

            // Search filters
            if (this.state.searchLeadName) {
                domain.push(["name", "ilike", this.state.searchLeadName]);
            }
            if (this.state.searchCustomerName) {
                domain.push(["partner_name", "ilike", this.state.searchCustomerName]);
            }
            if (this.state.searchPhone) {
                domain.push(["phone", "ilike", this.state.searchPhone]);
            }

            const fields = [
                "name", "partner_name", "phone", "email_from",
                "source_lead", "intended_car", "intended_level",
                "follow_up_person", "department",
                "last_followup_date", "next_contact_date",
                "stage_id", "create_date",
            ];

            const leads = await this.orm.searchRead(
                "crm.lead",
                domain,
                fields,
                {
                    limit: this.state.itemsPerPage,
                    offset: (this.state.currentPage - 1) * this.state.itemsPerPage,
                    order: "create_date desc",
                }
            );

            const totalCount = await this.orm.searchCount("crm.lead", domain);
            this.state.totalItems = totalCount;

            this.state.leads = leads.map((l) => ({
                id: l.id,
                name: l.name || "",
                partnerName: l.partner_name || "",
                phone: l.phone || "",
                email: l.email_from || "",
                sourceLead: this.formatSelection(l.source_lead),
                sourceLeadRaw: l.source_lead,
                intendedCar: l.intended_car || "",
                intendedLevel: this.formatSelection(l.intended_level),
                intendedLevelRaw: l.intended_level,
                followUpPerson: l.follow_up_person ? l.follow_up_person[1] : "",
                department: l.department || "",
                lastFollowup: l.last_followup_date ? this.formatDateTime(l.last_followup_date) : "",
                nextContact: l.next_contact_date ? this.formatDateTime(l.next_contact_date) : "",
                stageName: l.stage_id ? l.stage_id[1] : "",
                createDate: l.create_date ? this.formatDateTime(l.create_date) : "",
                selected: false,
            }));

        } catch (e) {
            console.warn("OriginalLeadsPage: Could not load leads", e);
            this.state.leads = [];
            this.state.totalItems = 0;
        }
    }

    formatSelection(value) {
        if (!value) return "";
        return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
    }

    formatDateTime(value) {
        if (!value) return "";
        // Format as YYYY-MM-DD HH:mm
        const d = new Date(value);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
    }

    // ─── Selection ────────────────────────────────────────
    toggleSelectAll() {
        this.state.selectAll = !this.state.selectAll;
        for (const l of this.state.leads) {
            l.selected = this.state.selectAll;
        }
        this._updateSelectedIds();
    }

    toggleSelect(leadId) {
        const lead = this.state.leads.find((l) => l.id === leadId);
        if (lead) {
            lead.selected = !lead.selected;
        }
        this.state.selectAll = this.state.leads.every((l) => l.selected);
        this._updateSelectedIds();
    }

    _updateSelectedIds() {
        this.state.selectedIds = this.state.leads
            .filter((l) => l.selected)
            .map((l) => l.id);
    }

    // ─── Badge Styling ────────────────────────────────────
    getBadgeClass(type, value) {
        const mapping = {
            sourceLead: {
                import: "badge-blue",
                other: "badge-grey",
                referral: "badge-green",
                truck_month: "badge-orange",
            },
            intendedLevel: {
                business: "badge-blue",
                standard: "badge-grey",
                enterprise: "badge-green",
            },
        };
        return (mapping[type] && mapping[type][value]) || "badge-grey";
    }

    // ─── Search / Filter ──────────────────────────────────
    onSearchInputChange(field, ev) {
        this.state[field] = ev.target.value;
    }

    onSearchKeydown(ev) {
        if (ev.key === "Enter") {
            this.onSearch();
        }
    }

    onSearch() {
        this.state.currentPage = 1;
        this.loadLeads();
    }

    onReset() {
        this.state.searchLeadName = "";
        this.state.searchCustomerName = "";
        this.state.searchPhone = "";
        this.state.activeStageId = null;
        this.state.currentPage = 1;
        this.loadLeads();
    }

    // ─── Row Click → Open Form ────────────────────────────
    onRowClick(lead) {
        this.actionService.doAction({
            type: "ir.actions.act_window",
            res_model: "crm.lead",
            res_id: lead.id,
            views: [[false, "form"]],
            target: "current",
        });
    }

    // ─── Actions ──────────────────────────────────────────
    async onDeleteSelected() {
        if (this.state.selectedIds.length === 0) return;
        if (confirm("Are you sure you want to delete selected leads?")) {
            await this.orm.unlink("crm.lead", this.state.selectedIds);
            this.state.selectedIds = [];
            this.state.selectAll = false;
            await this.loadLeads();
        }
    }

    // ─── Export CSV (all matching records) ─────────────────
    async onExport() {
        try {
            const domain = [["type", "=", "lead"]];
            if (this.state.activeStageId) {
                domain.push(["stage_id", "=", this.state.activeStageId]);
            }
            if (this.state.searchLeadName) {
                domain.push(["name", "ilike", this.state.searchLeadName]);
            }
            if (this.state.searchCustomerName) {
                domain.push(["partner_name", "ilike", this.state.searchCustomerName]);
            }
            if (this.state.searchPhone) {
                domain.push(["phone", "ilike", this.state.searchPhone]);
            }

            const allLeads = await this.orm.searchRead(
                "crm.lead",
                domain,
                [
                    "name", "partner_name", "phone", "email_from",
                    "source_lead", "intended_car", "intended_level",
                    "follow_up_person", "department",
                    "last_followup_date", "next_contact_date",
                    "stage_id",
                ],
                { order: "create_date desc" }
            );

            const headers = [
                "Lead Name", "Company Name", "Phone", "Email",
                "Source Lead", "Intended Car", "Intended Level",
                "Follow-up Person", "Department",
                "Last Follow-up Date", "Next Contact Date", "Stage",
            ];
            const fields = [
                "name", "partner_name", "phone", "email_from",
                "source_lead", "intended_car", "intended_level",
                "follow_up_person", "department",
                "last_followup_date", "next_contact_date", "stage_id",
            ];

            // BOM for UTF-8 Excel compatibility
            let csv = "\uFEFF" + headers.join(",") + "\n";
            for (const rec of allLeads) {
                const row = fields.map((f) => {
                    let val = rec[f];
                    if (val && typeof val === "object" && Array.isArray(val)) {
                        val = val[1]; // Many2one display name
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
            link.setAttribute("download", "geega_original_leads_export.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.warn("OriginalLeadsPage: Export failed", e);
        }
    }

    // ─── Pagination ───────────────────────────────────────
    get totalPages() {
        return Math.ceil(this.state.totalItems / this.state.itemsPerPage) || 1;
    }

    get paginationInfo() {
        const start = this.state.totalItems > 0
            ? (this.state.currentPage - 1) * this.state.itemsPerPage + 1
            : 0;
        const end = Math.min(
            this.state.currentPage * this.state.itemsPerPage,
            this.state.totalItems
        );
        return `${start} - ${end} of ${this.state.totalItems}`;
    }

    onItemsPerPageChange(ev) {
        this.state.itemsPerPage = parseInt(ev.target.value, 10);
        this.state.currentPage = 1;
        this.loadLeads();
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.state.currentPage = page;
            this.loadLeads();
        }
    }

    onGoToPage(ev) {
        if (ev.key === "Enter") {
            const page = parseInt(ev.target.value, 10);
            this.goToPage(page);
        }
    }
}

/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { TenderForm } from "./tender_form";
import { TenderDrawer } from "./tender_drawer";

export class TenderPage extends Component {
    static template = "geega_crm.TenderPage";
    static components = { TenderDrawer };

    setup() {
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.dialog = useService("dialog");

        this.state = useState({
            tenders: [],
            selectedIds: [],
            selectAll: false,
            filterType: "all",
            searchKeyword: "",
            // Pagination
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            selectedTenderId: null,
        });

        onWillStart(async () => {
            await this.loadTenders();
        });
    }

    async loadTenders() {
        try {
            // Load from geega.tender
            const domain = [];

            // Apply filter
            if (this.state.filterType !== 'all') {
                if (['approved', 'lost', 'negotiation', 'revision'].includes(this.state.filterType)) {
                    domain.push(['tender_stage', '=', this.state.filterType]);
                }
            }

            // Apply search
            if (this.state.searchKeyword) {
                domain.push('|', '|',
                    ['name', 'ilike', this.state.searchKeyword],
                    ['tender_no', 'ilike', this.state.searchKeyword],
                    ['partner_id.name', 'ilike', this.state.searchKeyword]
                );
            }

            const tenders = await this.orm.searchRead(
                "geega.tender",
                domain,
                [
                    "tender_no",
                    "name",
                    "partner_id",
                    "lead_id",
                    "user_id",
                    "vehicle_type",
                    "model",
                    "negotiation_status",
                    "tender_stage",
                    "tender_status",
                    "poc_required",
                    "submission_date",
                    "approval_status",
                    "department",
                    "create_date",
                    "write_date",
                    "remarks"
                ],
                {
                    limit: this.state.itemsPerPage,
                    offset: (this.state.currentPage - 1) * this.state.itemsPerPage,
                    order: "create_date desc",
                }
            );

            const totalCount = await this.orm.searchCount("geega.tender", domain);
            this.state.totalItems = totalCount;

            this.state.tenders = tenders.map((t) => ({
                id: t.id,
                tenderNo: t.tender_no || '',
                tenderTitle: t.name || '',
                customerName: t.partner_id ? t.partner_id[1] : '',
                leadNo: t.lead_id ? t.lead_id[1].split(' ')[0] : '', // Extract ID part if needed or use name
                owner: t.user_id ? t.user_id[1] : '',
                vehicleType: this.formatSelection(t.vehicle_type),
                vehicleTypeRaw: t.vehicle_type,
                model: t.model || '',
                negotiationStatus: this.formatSelection(t.negotiation_status),
                negotiationStatusRaw: t.negotiation_status,
                tenderStage: this.formatSelection(t.tender_stage),
                tenderStageRaw: t.tender_stage,
                tenderStatus: this.formatSelection(t.tender_status),
                tenderStatusRaw: t.tender_status,
                pocRequired: t.poc_required === 'yes' ? 'Yes' : 'No',
                submissionDate: t.submission_date || '',
                approvalStatus: this.formatSelection(t.approval_status),
                approvalStatusRaw: t.approval_status,
                department: this.formatSelection(t.department),
                updatedTime: t.write_date,
                createdTime: t.create_date,
                remarks: t.remarks || '',
                selected: false,
            }));

        } catch (e) {
            console.warn("TenderPage: Could not load tender data", e);
            this.state.tenders = [];
            this.state.totalItems = 0;
        }
    }

    formatSelection(value) {
        if (!value) return '';
        // Simple capitalization for demo, ideally use field definition
        return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
    }

    // --- Selection ---
    toggleSelectAll() {
        this.state.selectAll = !this.state.selectAll;
        for (const t of this.state.tenders) {
            t.selected = this.state.selectAll;
        }
        this._updateSelectedIds();
    }

    toggleSelect(tenderId) {
        const tender = this.state.tenders.find((t) => t.id === tenderId);
        if (tender) {
            tender.selected = !tender.selected;
        }
        this.state.selectAll = this.state.tenders.every((t) => t.selected);
        this._updateSelectedIds();
    }

    _updateSelectedIds() {
        this.state.selectedIds = this.state.tenders
            .filter((t) => t.selected)
            .map((t) => t.id);
    }

    // --- Badge styling helper ---
    getBadgeClass(type, value) {
        // value is the RAW value from backend (e.g. 'passenger', 'success')
        const mapping = {
            vehicleType: {
                passenger: "badge-green",
                truck: "badge-red",
                lorry: "badge-orange",
                bus: "badge-blue",
            },
            negotiationStatus: {
                success: "badge-green",
                failed: "badge-red",
                pending: "badge-grey",
            },
            tenderStage: {
                approved: "badge-green",
                lost: "badge-red",
                negotiation: "badge-grey",
                revision: "badge-orange"
            },
            tenderStatus: {
                success: "badge-green",
                failed: "badge-red",
                in_progress: "badge-grey",
            },
            approvalStatus: {
                approved: "badge-green",
                rejected: "badge-red",
                pending: "badge-grey"
            }
        };
        return (mapping[type] && mapping[type][value]) || "badge-grey";
    }

    // --- Actions ---
    onNewTender() {
        this.dialog.add(TenderForm, {
            onTenderCreated: () => {
                this.loadTenders();
            },
        });
    }

    // --- Drawer Actions ---
    onRowClick(tender) {
        this.state.selectedTenderId = tender.id;
    }

    onDrawerClose() {
        this.state.selectedTenderId = null;
    }

    // --- Actions ---
    async onUpdateStage() {
        // Example implementation using ORM write
        if (this.state.selectedIds.length === 0) return;
        // Logic to update stage would go here
        console.log("Update Stage for:", this.state.selectedIds);
    }

    async onUpdateResult() {
        console.log("Update Result for:", this.state.selectedIds);
    }

    onExportSelected() {
        console.log("Export Selected:", this.state.selectedIds);
    }

    async onDeleteSelected() {
        if (this.state.selectedIds.length === 0) return;
        if (confirm("Are you sure you want to delete selected items?")) {
            await this.orm.unlink("geega.tender", this.state.selectedIds);
            this.state.selectedIds = [];
            this.state.selectAll = false;
            await this.loadTenders();
        }
    }

    onImport() {
        console.log("Import clicked");
    }

    onExport() {
        console.log("Export clicked");
    }

    // --- Filter / Search ---
    onFilterChange(ev) {
        console.log("Filter changed:", ev.target.value);
        this.state.filterType = ev.target.value;
        this.state.currentPage = 1;
        this.loadTenders();
    }

    onSearchInput(ev) {
        this.state.searchKeyword = ev.target.value;
    }

    onSearch() {
        this.state.currentPage = 1;
        this.loadTenders();
    }

    onReset() {
        this.state.filterType = "all";
        this.state.searchKeyword = "";
        this.state.currentPage = 1;
        this.loadTenders();
    }

    // --- Pagination ---
    get totalPages() {
        return Math.ceil(this.state.totalItems / this.state.itemsPerPage) || 1;
    }

    get paginationInfo() {
        return `${this.state.totalItems > 0 ? (this.state.currentPage - 1) * this.state.itemsPerPage + 1 : 0} - ${Math.min(this.state.currentPage * this.state.itemsPerPage, this.state.totalItems)} of ${this.state.totalItems}`;
    }

    onItemsPerPageChange(ev) {
        this.state.itemsPerPage = parseInt(ev.target.value, 10);
        this.state.currentPage = 1;
        this.loadTenders();
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.state.currentPage = page;
            this.loadTenders();
        }
    }

    onGoToPage(ev) {
        if (ev.key === "Enter") {
            const page = parseInt(ev.target.value, 10);
            this.goToPage(page);
        }
    }
}

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
            const result = await this.orm.call(
                "geega.tender",
                "get_tender_dashboard_data",
                [],
                {
                    filter_type: this.state.filterType,
                    search: this.state.searchKeyword,
                    page: this.state.currentPage,
                    limit: this.state.itemsPerPage,
                }
            );

            this.state.totalItems = result.total;
            this.state.tenders = result.tenders.map((t) => ({
                ...t,
                selected: false,
            }));

        } catch (e) {
            console.warn("TenderPage: Could not load tender data", e);
            this.state.tenders = [];
            this.state.totalItems = 0;
        }
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
        if (this.state.selectedIds.length === 0) return;
        const ids = this.state.selectedIds.join(',');
        window.open(`/geega_crm/export/tenders?ids=${ids}`, '_blank');
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
        const params = new URLSearchParams({
            filter_type: this.state.filterType,
            search: this.state.searchKeyword,
        });
        window.open(`/geega_crm/export/tenders?${params.toString()}`, '_blank');
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

    onSearchKeydown(ev) {
        if (ev.key === "Enter") {
            this.onSearch();
        }
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

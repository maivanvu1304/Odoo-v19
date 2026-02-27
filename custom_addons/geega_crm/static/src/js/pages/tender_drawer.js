/** @odoo-module **/

import { Component, useState, onWillStart, onWillUpdateProps } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";

export class TenderDrawer extends Component {
    static template = "geega_crm.TenderDrawer";
    static props = {
        tenderId: Number,
        onClose: Function,
        canDelete: { type: Boolean, optional: true },
        onTenderUpdated: { type: Function, optional: true },
    };

    setup() {
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.notification = useService("notification");

        this.state = useState({
            loading: true,
            activeTab: 'detail', // detail, negotiation, bodybuilder, final_quote, poc, document, result, attachment
            tender: {},
        });

        // Computed Tabs configuration
        this.tabs = [
            { id: 'detail', label: _t('Detailed Information') },
            { id: 'negotiation', label: _t('Negotiation Information') },
            { id: 'bodybuilder', label: _t('Bodybuilder Quotation') },
            { id: 'final_quote', label: _t('Final Quotation (Chassis + Body)') },
            { id: 'poc', label: _t('Proof of Concept (POC) (Optional)') },
            { id: 'document', label: _t('Tender Document Submission') },
            { id: 'result', label: _t('Tender Result') },
            { id: 'attachment', label: _t('Attachment') },
        ];

        onWillStart(async () => {
            await this.loadTenderData();
        });

        onWillUpdateProps(async (nextProps) => {
            if (nextProps.tenderId !== this.props.tenderId) {
                await this.loadTenderData(nextProps.tenderId);
            }
        });
    }

    async loadTenderData(tenderId = this.props.tenderId) {
        if (!tenderId) return;

        this.state.loading = true;
        try {
            const [tender] = await this.orm.read("geega.tender", [tenderId], [
                "tender_no", "name", "partner_id", "lead_id", "user_id",
                "vehicle_type", "model", "negotiation_status", "tender_stage",
                "tender_status", "poc_required", "submission_date",
                "approval_status", "department", "create_date", "write_date", "remarks"
            ]);

            if (tender) {
                this.state.tender = {
                    ...tender,
                    partner_name: tender.partner_id ? tender.partner_id[1] : '',
                    lead_name: tender.lead_id ? tender.lead_id[1] : '',
                    user_name: tender.user_id ? tender.user_id[1] : '',
                    vehicle_type_label: this.formatSelection(tender.vehicle_type),
                    tender_stage_label: this.formatSelection(tender.tender_stage),
                    tender_status_label: this.formatSelection(tender.tender_status),
                };
            }
        } catch (error) {
            console.error("Error loading tender details:", error);
            this.notification.add(_t("Could not load tender details"), { type: "danger" });
        } finally {
            this.state.loading = false;
        }
    }

    formatSelection(value) {
        if (!value) return '';
        return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
    }

    // --- Actions ---
    selectTab(tabId) {
        this.state.activeTab = tabId;
    }

    onClose() {
        this.props.onClose();
    }

    async onEdit() {
        // Implement edit logic - for now, maybe open the form view or dialog
        // This could reuse TenderForm in edit mode
        console.log("Edit clicked for", this.props.tenderId);
    }

    async onDelete() {
        if (!this.props.canDelete) {
            return;
        }
        if (confirm(_t("Are you sure you want to delete this tender?"))) {
            try {
                await this.orm.unlink("geega.tender", [this.props.tenderId]);
                this.props.onTenderUpdated && this.props.onTenderUpdated();
                this.onClose();
            } catch (e) {
                console.error("Error deleting tender", e);
                this.notification.add(_t("Error deleting tender"), { type: "danger" });
            }
        }
    }

    async onUpdateStatus() {
        console.log("Update Status clicked");
    }
}

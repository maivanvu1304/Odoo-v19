/** @odoo-module **/

import { Component, useState, onWillStart, onWillUpdateProps } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class LeadDrawer extends Component {
    static template = "geega_crm.LeadDrawer";
    static props = {
        leadId: Number,
        onClose: Function,
        canDelete: { type: Boolean, optional: true },
        onLeadUpdated: { type: Function, optional: true },
    };

    setup() {
        this.orm = useService("orm");
        this.actionService = useService("action");

        this.state = useState({
            loading: true,
            activeTab: "detail",
            lead: {},
            stages: [],
        });

        this.tabs = [
            { id: "detail", label: "Detailed Information" },
            { id: "business_reg", label: "Business Registration" },
            { id: "followup", label: "Follow-up" },
            { id: "attachment", label: "Attachment" },
            { id: "operation_log", label: "Operation Log" },
        ];

        onWillStart(async () => {
            await this.loadStages();
            await this.loadLeadData();
        });

        onWillUpdateProps(async (nextProps) => {
            if (nextProps.leadId !== this.props.leadId) {
                await this.loadLeadData(nextProps.leadId);
            }
        });
    }

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
            console.warn("LeadDrawer: Could not load stages", e);
        }
    }

    async loadLeadData(leadId = this.props.leadId) {
        if (!leadId) return;

        this.state.loading = true;
        try {
            const [lead] = await this.orm.read("crm.lead", [leadId], [
                "name", "partner_name", "contact_name", "phone",
                "email_from", "source_lead", "intended_car", "intended_level",
                "follow_up_person", "department",
                "last_followup_date", "next_contact_date",
                "stage_id", "user_id", "team_id",
                "expected_revenue", "probability",
                "description", "create_date", "write_date",
                "city", "street", "street2", "country_id",
                "create_uid",
            ]);

            if (lead) {
                // Build address string
                let address = [lead.street, lead.street2, lead.city]
                    .filter(Boolean).join(", ");
                if (lead.country_id) {
                    address += address ? ", " + lead.country_id[1] : lead.country_id[1];
                }

                this.state.lead = {
                    ...lead,
                    stage_name: lead.stage_id ? lead.stage_id[1] : "",
                    stage_id_val: lead.stage_id ? lead.stage_id[0] : null,
                    user_name: lead.user_id ? lead.user_id[1] : "",
                    team_name: lead.team_id ? lead.team_id[1] : "",
                    follow_up_person_name: lead.follow_up_person ? lead.follow_up_person[1] : "",
                    source_lead_label: this.formatSelection(lead.source_lead),
                    intended_level_label: this.formatSelection(lead.intended_level),
                    create_date_fmt: this.formatDateTime(lead.create_date),
                    write_date_fmt: this.formatDateTime(lead.write_date),
                    last_followup_fmt: this.formatDateTime(lead.last_followup_date),
                    next_contact_fmt: this.formatDateTime(lead.next_contact_date),
                    address: address,
                    created_by: lead.create_uid ? lead.create_uid[1] : "",
                };
            }
        } catch (error) {
            console.error("Error loading lead details:", error);
        } finally {
            this.state.loading = false;
        }
    }

    formatSelection(value) {
        if (!value) return "";
        return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
    }

    formatDateTime(value) {
        if (!value) return "";
        const d = new Date(value);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        return `${dd}/${mm}/${yyyy}, ${hh}:${mi}`;
    }

    // --- Progress bar helpers ---
    getStageIndex() {
        if (!this.state.lead.stage_id_val || !this.state.stages.length) return -1;
        return this.state.stages.findIndex((s) => s.id === this.state.lead.stage_id_val);
    }

    isStageCompleted(stageIdx) {
        return stageIdx < this.getStageIndex();
    }

    isStageActive(stageIdx) {
        return stageIdx === this.getStageIndex();
    }

    isLineCompleted(stageIdx) {
        return stageIdx < this.getStageIndex();
    }

    // --- Actions ---
    selectTab(tabId) {
        this.state.activeTab = tabId;
    }

    onClose() {
        this.props.onClose();
    }

    onEdit() {
        console.log("Edit clicked for", this.props.leadId);
    }

    onTransfer() {
        console.log("Transfer clicked for", this.props.leadId);
    }

    onConvert() {
        console.log("Convert clicked for", this.props.leadId);
    }

    async onDelete() {
        if (!this.props.canDelete) {
            return;
        }
        if (confirm("Are you sure you want to delete this lead?")) {
            try {
                await this.orm.unlink("crm.lead", [this.props.leadId]);
                if (this.props.onLeadUpdated) {
                    this.props.onLeadUpdated();
                }
                this.onClose();
            } catch (e) {
                console.error("Error deleting lead", e);
            }
        }
    }
}

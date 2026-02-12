/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { Dialog } from "@web/core/dialog/dialog";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";

export class TenderForm extends Component {
    static template = "geega_crm.TenderForm";
    static components = { Dialog };
    static props = {
        close: Function,
        onTenderCreated: { type: Function, optional: true },
    };

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");

        this.state = useState({
            title: "",
            partner_id: false,
            lead_id: false,
            user_id: false,
            vehicle_type: "",
            model: "",
            negotiation_status: "",
            tender_stage: "",
            tender_status: "",
            poc_required: "no",
            submission_date: "",
            approval_status: "",
            department: "",
            remarks: "",
        });

        // Relational data for dropdowns
        this.partners = [];
        this.leads = [];
        this.users = [];

        onWillStart(async () => {
            // Load basic data for dropdowns
            try {
                const [partners, leads, users] = await Promise.all([
                    this.orm.searchRead("res.partner", [], ["id", "name"], { limit: 50 }),
                    this.orm.searchRead("crm.lead", [], ["id", "name"], { limit: 50 }),
                    this.orm.searchRead("res.users", [], ["id", "name"], { limit: 50 }),
                ]);
                this.partners = partners;
                this.leads = leads;
                this.users = users;
            } catch (e) {
                console.error("Failed to load dropdown data", e);
            }
        });
    }

    async save() {
        if (!this.state.title) {
            this.notification.add(_t("Please enter a Tender Title"), { type: "danger" });
            return;
        }

        try {
            await this.orm.create("geega.tender", [{
                name: this.state.title,
                partner_id: this.state.partner_id ? parseInt(this.state.partner_id) : false,
                lead_id: this.state.lead_id ? parseInt(this.state.lead_id) : false,
                user_id: this.state.user_id ? parseInt(this.state.user_id) : false,
                vehicle_type: this.state.vehicle_type || false,
                model: this.state.model,
                negotiation_status: this.state.negotiation_status || false,
                tender_stage: this.state.tender_stage || false,
                tender_status: this.state.tender_status || false,
                poc_required: this.state.poc_required,
                submission_date: this.state.submission_date || false,
                approval_status: this.state.approval_status || false,
                department: this.state.department || false,
                remarks: this.state.remarks,
            }]);

            this.notification.add(_t("Tender created successfully"), { type: "success" });
            if (this.props.onTenderCreated) {
                this.props.onTenderCreated();
            }
            this.props.close();
        } catch (e) {
            console.error("Error creating tender", e);
            this.notification.add(_t("Error creating tender"), { type: "danger" });
        }
    }
}

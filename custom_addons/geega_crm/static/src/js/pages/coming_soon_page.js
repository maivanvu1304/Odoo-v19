/** @odoo-module **/

import { Component } from "@odoo/owl";

export class ComingSoonPage extends Component {
    static template = "geega_crm.ComingSoonPage";
    static props = {
        menuId: { type: String },
        menuName: { type: String, optional: true },
    };

    get pageTitle() {
        return `Sales Mgmt - ${this.props.menuName || this.props.menuId}`;
    }
}

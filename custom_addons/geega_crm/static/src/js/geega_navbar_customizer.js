/** @odoo-module **/

import { user } from "@web/core/user";

// When the app starts, check if current user belongs to the Geega CRM Admin group.
// If not, add a CSS class to <body> so systray items can be hidden via SCSS.
(async () => {
    const isGeegaAdmin = await user.hasGroup("geega_crm.group_geega_crm_admin");
    if (!isGeegaAdmin) {
        document.body.classList.add("geega_user_role");
    } else {
        document.body.classList.add("geega_admin_role");
    }
})();

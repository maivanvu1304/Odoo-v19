# -*- coding: utf-8 -*-

from odoo import models, fields, api


class CrmLeadExtended(models.Model):
    _inherit = 'crm.lead'

    # Source Lead field
    source_lead = fields.Selection([
        ('import', 'Import'),
        ('other', 'Other'),
        ('referral', 'Referral'),
        ('truck_month', 'Truck Month'),
    ], string='Source Lead', tracking=True)

    # Intended Car field
    intended_car = fields.Char(string='Intended Car', tracking=True)

    # Intended Level field
    intended_level = fields.Selection([
        ('business', 'Business'),
        ('standard', 'Standard'),
        ('enterprise', 'Enterprise'),
    ], string='Intended Level', tracking=True)

    # Follow-up Person (assigned user)
    follow_up_person = fields.Many2one(
        'res.users',
        string='Follow-up Person',
        tracking=True,
        default=lambda self: self.env.user
    )

    # Department field
    department = fields.Char(string='Department', tracking=True)

    # Last Follow-up Date
    last_followup_date = fields.Datetime(
        string='Last Follow-up Date',
        tracking=True
    )

    # Next Contact Date
    next_contact_date = fields.Datetime(
        string='Next Contact Date',
        tracking=True
    )

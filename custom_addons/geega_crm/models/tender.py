# -*- coding: utf-8 -*-

from odoo import models, fields, api

class GeegaTender(models.Model):
    _name = 'geega.tender'
    _description = 'Geega Tender Management'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc'

    name = fields.Char(string='Tender Title', required=True, tracking=True)
    tender_no = fields.Char(string='Tender No.', required=True, copy=False, readonly=True, index=True, default=lambda self: 'New')
    
    partner_id = fields.Many2one('res.partner', string='Customer Name', tracking=True)
    lead_id = fields.Many2one('crm.lead', string='Lead No.', tracking=True)
    user_id = fields.Many2one('res.users', string='Owner', default=lambda self: self.env.user, tracking=True)
    
    vehicle_type = fields.Selection([
        ('passenger', 'Passenger'),
        ('truck', 'Truck'),
        ('lorry', 'Lorry'),
        ('bus', 'Bus')
    ], string='Vehicle Type', tracking=True)
    
    model = fields.Char(string='Model', tracking=True)
    
    negotiation_status = fields.Selection([
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('pending', 'Pending')
    ], string='Negotiation Status', default='pending', tracking=True)
    
    tender_stage = fields.Selection([
        ('approved', 'Approved'),
        ('lost', 'Lost'),
        ('negotiation', 'Negotiation'),
        ('revision', 'Revision')
    ], string='Tender Stage', default='negotiation', tracking=True)
    
    tender_status = fields.Selection([
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('in_progress', 'In Progress')
    ], string='Tender Status', default='in_progress', tracking=True)
    
    poc_required = fields.Selection([
        ('yes', 'Yes'),
        ('no', 'No')
    ], string='POC Required', default='no', tracking=True)
    
    approval_status = fields.Selection([
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('pending', 'Pending')
    ], string='Approval Status', default='pending', tracking=True)
    
    submission_date = fields.Date(string='Submission Date', tracking=True)
    
    department = fields.Selection([
        ('fleet_sales', 'Fleet Sales'),
        ('public_transport', 'Public Transport'),
        ('corporate_sales', 'Corporate Sales'),
        ('education_transport', 'Education Transport'),
        ('heavy_equipment', 'Heavy Equipment'),
        ('aviation_sales', 'Aviation Sales')
    ], string='Department', tracking=True)
    
    remarks = fields.Text(string='Remarks')

    @api.model
    def create(self, vals):
        if vals.get('tender_no', 'New') == 'New':
            vals['tender_no'] = self.env['ir.sequence'].next_by_code('geega.tender') or 'New'
        return super(GeegaTender, self).create(vals)

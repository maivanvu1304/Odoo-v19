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

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('tender_no', 'New') == 'New':
                vals['tender_no'] = self.env['ir.sequence'].next_by_code('geega.tender') or 'New'
        return super(GeegaTender, self).create(vals_list)

    @api.model
    def get_tender_dashboard_data(self, filter_type='all', search='', page=1, limit=10):
        """Single-call method for Tender Dashboard.
        Returns tenders (paginated) + total count, all formatted.
        """
        domain = []

        # Filter by tender_stage
        if filter_type and filter_type != 'all':
            if filter_type in ('approved', 'lost', 'negotiation', 'revision'):
                domain.append(('tender_stage', '=', filter_type))

        # Search across name, tender_no, partner
        if search:
            domain += [
                '|', '|',
                ('name', 'ilike', search),
                ('tender_no', 'ilike', search),
                ('partner_id.name', 'ilike', search),
            ]

        total = self.search_count(domain)

        fields_list = [
            'tender_no', 'name', 'partner_id', 'lead_id', 'user_id',
            'vehicle_type', 'model', 'negotiation_status', 'tender_stage',
            'tender_status', 'poc_required', 'submission_date',
            'approval_status', 'department', 'create_date', 'write_date', 'remarks',
        ]

        records = self.search_read(
            domain,
            fields_list,
            limit=limit,
            offset=(page - 1) * limit,
            order='create_date desc',
        )

        # Format selection labels server-side
        def fmt(val):
            if not val:
                return ''
            return val[0].upper() + val[1:].replace('_', ' ')

        tenders = []
        for r in records:
            tenders.append({
                'id': r['id'],
                'tenderNo': r.get('tender_no') or '',
                'tenderTitle': r.get('name') or '',
                'customerName': r['partner_id'][1] if r.get('partner_id') else '',
                'leadNo': r['lead_id'][1] if r.get('lead_id') else '',
                'owner': r['user_id'][1] if r.get('user_id') else '',
                'vehicleType': fmt(r.get('vehicle_type')),
                'vehicleTypeRaw': r.get('vehicle_type') or '',
                'model': r.get('model') or '',
                'negotiationStatus': fmt(r.get('negotiation_status')),
                'negotiationStatusRaw': r.get('negotiation_status') or '',
                'tenderStage': fmt(r.get('tender_stage')),
                'tenderStageRaw': r.get('tender_stage') or '',
                'tenderStatus': fmt(r.get('tender_status')),
                'tenderStatusRaw': r.get('tender_status') or '',
                'pocRequired': 'Yes' if r.get('poc_required') == 'yes' else 'No',
                'submissionDate': r.get('submission_date') or '',
                'approvalStatus': fmt(r.get('approval_status')),
                'approvalStatusRaw': r.get('approval_status') or '',
                'department': fmt(r.get('department')),
                'updatedTime': r.get('write_date'),
                'createdTime': r.get('create_date'),
                'remarks': r.get('remarks') or '',
            })

        return {
            'tenders': tenders,
            'total': total,
        }

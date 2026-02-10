# from odoo import models, fields, api


# class geega_crm(models.Model):
#     _name = 'geega_crm.geega_crm'
#     _description = 'geega_crm.geega_crm'

#     name = fields.Char()
#     value = fields.Integer()
#     value2 = fields.Float(compute="_value_pc", store=True)
#     description = fields.Text()
#
#     @api.depends('value')
#     def _value_pc(self):
#         for record in self:
#             record.value2 = float(record.value) / 100


# from odoo import http


# class GeegaCrm(http.Controller):
#     @http.route('/geega_crm/geega_crm', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/geega_crm/geega_crm/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('geega_crm.listing', {
#             'root': '/geega_crm/geega_crm',
#             'objects': http.request.env['geega_crm.geega_crm'].search([]),
#         })

#     @http.route('/geega_crm/geega_crm/objects/<model("geega_crm.geega_crm"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('geega_crm.object', {
#             'object': obj
#         })


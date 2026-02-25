import io
import json

from odoo import http
from odoo.http import request, content_disposition

import xlsxwriter


class GeegaCrmExportController(http.Controller):

    @http.route('/geega_crm/export/tenders', type='http', auth='user')
    def export_tenders(self, ids=None, filter_type='all', search='', **kwargs):
        """Export tenders to Excel.
        - If `ids` is provided, exports only those tenders (Export Selected).
        - Otherwise, exports all tenders matching the current filter/search (Export All).
        """
        TenderModel = request.env['geega.tender']

        if ids:
            # Export Selected — specific IDs
            tender_ids = [int(i) for i in ids.split(',') if i.strip()]
            tenders = TenderModel.browse(tender_ids)
        else:
            # Export All — apply same filter/search as dashboard
            domain = []
            if filter_type and filter_type != 'all':
                if filter_type in ('approved', 'lost', 'negotiation', 'revision'):
                    domain.append(('tender_stage', '=', filter_type))
            if search:
                domain += [
                    '|', '|',
                    ('name', 'ilike', search),
                    ('tender_no', 'ilike', search),
                    ('partner_id.name', 'ilike', search),
                ]
            tenders = TenderModel.search(domain, order='create_date desc')

        # --- Build Excel ---
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        sheet = workbook.add_worksheet('Tenders')

        # Styles
        header_fmt = workbook.add_format({
            'bold': True,
            'bg_color': '#217346',
            'font_color': '#FFFFFF',
            'border': 1,
            'align': 'center',
            'valign': 'vcenter',
            'font_size': 11,
        })
        cell_fmt = workbook.add_format({
            'border': 1,
            'valign': 'vcenter',
            'font_size': 10,
        })
        date_fmt = workbook.add_format({
            'border': 1,
            'valign': 'vcenter',
            'font_size': 10,
            'num_format': 'yyyy-mm-dd',
        })

        def fmt_selection(val):
            if not val:
                return ''
            return val[0].upper() + val[1:].replace('_', ' ')

        # Headers
        headers = [
            'Tender No.', 'Tender Title', 'Customer Name', 'Lead No.',
            'Owner', 'Vehicle Type', 'Model', 'Negotiation Status',
            'Tender Stage', 'Tender Status', 'POC Required',
            'Submission Date', 'Approval Status', 'Department',
            'Remarks', 'Created Time', 'Updated Time',
        ]
        for col, header in enumerate(headers):
            sheet.write(0, col, header, header_fmt)
            sheet.set_column(col, col, 18)

        # Data rows
        for row, t in enumerate(tenders, start=1):
            sheet.write(row, 0, t.tender_no or '', cell_fmt)
            sheet.write(row, 1, t.name or '', cell_fmt)
            sheet.write(row, 2, t.partner_id.name if t.partner_id else '', cell_fmt)
            sheet.write(row, 3, t.lead_id.name if t.lead_id else '', cell_fmt)
            sheet.write(row, 4, t.user_id.name if t.user_id else '', cell_fmt)
            sheet.write(row, 5, fmt_selection(t.vehicle_type), cell_fmt)
            sheet.write(row, 6, t.model or '', cell_fmt)
            sheet.write(row, 7, fmt_selection(t.negotiation_status), cell_fmt)
            sheet.write(row, 8, fmt_selection(t.tender_stage), cell_fmt)
            sheet.write(row, 9, fmt_selection(t.tender_status), cell_fmt)
            sheet.write(row, 10, 'Yes' if t.poc_required == 'yes' else 'No', cell_fmt)
            sheet.write(row, 11, str(t.submission_date) if t.submission_date else '', date_fmt)
            sheet.write(row, 12, fmt_selection(t.approval_status), cell_fmt)
            sheet.write(row, 13, fmt_selection(t.department), cell_fmt)
            sheet.write(row, 14, t.remarks or '', cell_fmt)
            sheet.write(row, 15, str(t.create_date) if t.create_date else '', cell_fmt)
            sheet.write(row, 16, str(t.write_date) if t.write_date else '', cell_fmt)

        workbook.close()
        output.seek(0)

        filename = 'tenders_export.xlsx'
        return request.make_response(
            output.read(),
            headers=[
                ('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                ('Content-Disposition', content_disposition(filename)),
            ]
        )

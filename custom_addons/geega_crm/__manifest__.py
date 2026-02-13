{
    'name': "Geega CRM",

    'summary': "Advanced CRM System for Geega with Lead Management",

    'description': """
Geega CRM Module
================
Complete CRM solution with:
* Extended lead management with custom fields
* Multiple department tracking
* Enhanced follow-up system
* Custom green-themed interface
* Comprehensive lead stages and workflow
    """,

    'author': "Geega",
    'website': "https://www.geega.com",

    'category': 'Sales/CRM',
    'version': '19.0.1.0.0',
    'license': 'LGPL-3',

    # Module dependencies
    'depends': ['base', 'crm', 'sales_team'],

    # Data files loaded on installation
    'data': [
        'security/ir.model.access.csv',
        'data/crm_stage_data.xml',
        'data/ir_sequence_data.xml',
        'data/demo_data.xml',
        'views/crm_lead_views.xml',
        'views/sales_views.xml',
        'views/tender_views.xml',
        'views/menus.xml',
    ],
    
    'assets': {
        'web.assets_backend': [
            'geega_crm/static/src/scss/geega_crm.scss',
            'geega_crm/static/src/js/geega_list_controller.js',
            'geega_crm/static/src/xml/geega_list_view.xml',
            'geega_crm/static/src/js/pages/workbench_page.js',
            'geega_crm/static/src/xml/pages/workbench_page.xml',
            'geega_crm/static/src/js/pages/coming_soon_page.js',
            'geega_crm/static/src/xml/pages/coming_soon_page.xml',
            'geega_crm/static/src/js/pages/tender_page.js',
            'geega_crm/static/src/xml/pages/tender_page.xml',
            'geega_crm/static/src/js/pages/tender_form.js',
            'geega_crm/static/src/xml/pages/tender_form.xml',
            'geega_crm/static/src/js/pages/tender_drawer.js',
            'geega_crm/static/src/xml/pages/tender_drawer.xml',
            'geega_crm/static/src/js/geega_sales_dashboard.js',
            'geega_crm/static/src/xml/geega_sales_dashboard.xml',
        ],
    },
    
    'installable': True,
    'application': True,
    'auto_install': False,
}


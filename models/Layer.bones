// Layer
// -----
// Model. Represents a single map layer. This model is a child of
// the Project model and is saved serialized as part of the parent.
// **This model is not backed directly by the server.**
model = Backbone.Model.extend({
    schema: {
        'type': 'object',
        'properties': {
            'name': {
                'type': 'string',
                'required': true,
                'pattern': '^[A-Za-z0-9\-_]+$',
                'title': 'Name',
                'description': 'Name may include alphanumeric characters, dashes and underscores.'
            },
            'id': {
                'type': 'string',
                'required': true,
                'pattern': '^[A-Za-z0-9\-_]+$',
                'title': 'ID',
                'description': 'ID may include alphanumeric characters, dashes and underscores.'
            },
            'class': {
                'type': 'string',
                'pattern': '^[A-Za-z0-9\-_ ]*$',
                'title': 'Class',
                'description': 'Class may include alphanumeric characters, spaces, dashes and underscores.'
            },
            'srs': {
                'type': 'string'
            },
            'geometry': {
                'type': 'string',
                'enum': ['polygon', 'point', 'linestring', 'raster', 'unknown']
            },
            'Datasource': {
                'type': 'object',
                'required': true
            }
        }
    },
    // @TODO either as a feature or a bug, object attributes are not set
    // automatically when passed to the constructor. We set it manually here.
    initialize: function(attributes) {
        this.set({'Datasource': attributes.Datasource});
    },
    // Constant. Hash of simple names to known SRS strings.
    SRS: {
        // note: 900913 should be the same as EPSG 3857
        '900913': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over',
        'WGS84': '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs'
    },
    // Get the name of a model's SRS string if known, otherwise reteurn
    // 'custom' or 'autodetect' if empty.
    srsName: function(srs) {
        srs = srs || this.get('srs');
        for (name in this.SRS) {
            if (this.SRS[name] === this.get('srs')) return name;
        }
        return srs ? 'custom' : 'autodetect';
    },
    validate: function(attr) {
        if (attr.id &&
            this.collection &&
            this.collection.get(attr.id) &&
            this.collection.get(attr.id) !== this)
                return new Error(_('Layer with ID "<%=id%>" already exists.').template(attr));
    },
    // Custom validation method that allows for asynchronous processing.
    // Expects options.success and options.error callbacks to be consistent
    // with other Backbone methods.
    validateAsync: function(attributes, options) {
        (new models.Datasource(_(attributes.Datasource).extend({
            id: attributes.id,
            project: this.collection.parent.get('id')
        }))).fetch({
            success: _(function(model, resp) {
                if (resp.geometry_type)
                    this.set({geometry:resp.geometry_type});
                options.success(model, resp);
            }).bind(this),
            error: options.error
        });
    }
});


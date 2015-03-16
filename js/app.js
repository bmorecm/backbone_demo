var app = {
    compile_templates: function(){
        var temps = {};
        for(i in templates){
            var temp = Handlebars.compile(templates[i]);
            temps[i] = temp;
        }
        return temps;
    },
    sample_text: $('#lorem').html(),
    init: function(){
        app.templates = app.compile_templates();
        _.extend(app, Backbone.Events);
        //router
        app.router = new Router();
        app.router.route(':id', 'post', function(id){
            var post = app.post_list.get(id);
            post.set({selected: true});
            //usually would trigger fetch on the model view here
            app.main_view.model.set(post.attributes);
        });
        //create main view
        app.main_view = new MainPostView({model: new MainPost({content: app.sample_text}), template: app.templates.post});
        //create post list
        app.post_list = new PostList();
        app.post_list_view = new PostListView({collection: app.post_list});
        var colors = ['#000','#2dabcf'];
        //adding some posts to simulate initial server side render       
        for(i=0;i<10;i++){
            var rand = Math.floor(i % 2);
            var temp_model = new Post({title: 'new post' + i, content: app.sample_text, color: colors[rand], id: i.toString()});
            app.post_list.add(temp_model);
        }
        
        Backbone.history.start({root: '/backbone_test/'});
    }
};

//model and view for the main post view 
var MainPost = Backbone.Model.extend({
    defaults: {
        title: 'Post title',
        content: 'Post content'
    }
});

var MainPostView = Backbone.View.extend({
    el: '#main',
    initialize: function(options){
        this.template = options.template;
        this.listenTo(this.model, 'change', this.render);
        this.listenTo(app, 'animateOut', function(){this.loading(1)})
        this.render();
    },
    render: function(){
        this.$el.html(this.template(this.model.attributes));
    },
    loading: function(state){
        var $el = this.$el;
        $el.addClass('out');
        app.timer = setTimeout(function(){
            $el.removeClass('out');
        }, 400);
    }
})

//models and views for list post views
var Post = Backbone.Model.extend({
    defaults: {
        title: 'Post',
        content: 'post content', 
        selected: false
    }
});

var PostView = Backbone.View.extend({
    events: {
        'click' : 'getPost'
    },
    initialize: function(options){
        this.template = options.template;
        this.setElement(this.template());
        this.listenTo(app, 'updateState', this.renderState);
        this.render();
    },
    render: function(){
        this.setElement(this.template(this.model.attributes));
    },
    getPost: function(event){
        event.preventDefault();
        if(!this.model.attributes.selected){
            app.trigger('animateOut');
            var id = this.model.attributes.id;
            app.router.navigate(id, {trigger: true});
            this.model.set({selected: true});
        }    
    },
    renderState: function(){
        if(this.model.attributes.selected){
            this.$el.addClass('active');
        }else{
            this.$el.removeClass('active');
        }
    }
});

var PostList = Backbone.Collection.extend({
    model: Post
});

var PostListView = Backbone.View.extend({
    el: '#post-list',
    initialize: function(){
        this.listenTo(this.collection, 'add', this.addItem);
        this.listenTo(this.collection, 'change:selected', this.updateActive);
    },
    addItem: function(item){
        var view = new PostView({model: item, template: app.templates.list_post});
        this.$el.append(view.$el);
    },
    updateActive: function(item){
        var activePost = item;

        this.collection.each(function(item){
            if(item != activePost){
                item.set({selected: false}, {silent: true});
            }
        })
        app.trigger('updateState', 'update');
    }
})

var Router = Backbone.Router.extend({});

app.init();
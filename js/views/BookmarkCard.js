import _ from 'underscore';
import Backbone from 'backbone';
import Tags from '../models/Tags';
import TagsNavigationView from './TagsNavigation';
import templateString from '../templates/BookmarkCard.html';

const Marionette = Backbone.Marionette;
const Radio = Backbone.Radio;

export default Marionette.View.extend({
	template: _.template(templateString),
	className: 'bookmark-card',
	ui: {
		link: 'h2 > a',
		checkbox: '.selectbox',
		actionsMenu: '.popovermenu',
		actionsToggle: '.toggle-actions'
	},
	regions: {
		tags: '.tags'
	},
	events: {
		click: 'open',
		'click @ui.link': 'clickLink',
		'click @ui.checkbox': 'select',
		'click @ui.actionsToggle': 'toggleActions',
		'click .menu-filter-add': 'select',
		'click .menu-filter-remove': 'select',
		'click .menu-delete': 'delete',
		'click .menu-details': 'open'
	},
	initialize: function(opts) {
		this.app = opts.app;
		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'select', this.onSelect);
		this.listenTo(this.model, 'unselect', this.onUnselect);
		this.listenTo(this.app.tags, 'sync', this.render);
		this.listenTo(Radio.channel('documentClicked'), 'click', this.closeActions);
	},
	onRender: function() {
		var that = this;
		this.$el.css(
			'background-image',
			'url(bookmark/' + this.model.get('id') + '/image)'
		);
		this.$el.css('background-color', this.model.getColor());

		this.$el.prop('title', t('bookmarks', 'Open details'));

		var tags = new Tags(
			this.model.get('tags').map(function(id) {
				return that.app.tags.findWhere({ name: id });
			})
		);
		this.showChildView('tags', new TagsNavigationView({ collection: tags }));
		this.$('.checkbox').prop('checked', this.$el.hasClass('active'));
	},
	clickLink: function(e) {
		if (e && e.target === this.getUI('actionsToggle')[0]) {
			return;
		}
		this.model.clickLink();
	},
	open: function(e) {
		if (
			e &&
			(this.getUI('actionsToggle')[0] === e.target ||
				this.getUI('link')[0] === e.target ||
				$.contains(this.$('.tags')[0], e.target))
		) {
			return;
		}
		if (this.$el.closest('.selection-active').length) {
			this.select(e);
			e.preventDefault();
			return;
		}
		if (e) {
			e.stopPropagation();
		}
		Radio.channel('details').trigger('show', this.model);
	},
	toggleActions: function() {
		this.getUI('actionsMenu')
			.toggleClass('open')
			.toggleClass('closed');
	},
	closeActions: function(e) {
		if (e && this.getUI('actionsToggle')[0] === e.target) {
			return;
		}
		this.getUI('actionsMenu')
			.removeClass('open')
			.addClass('closed');
	},
	select: function(e) {
		e.stopPropagation();
		if (this.$el.hasClass('active')) {
			this.model.trigger('unselect', this.model);
		} else {
			this.model.trigger('select', this.model);
		}
	},
	onSelect: function() {
		this.$el.addClass('active');
		this.render();
	},
	onUnselect: function() {
		this.$el.removeClass('active');
		this.render();
	},
	delete: function() {
		this.model.destroy();
	}
});

'use strict';

const $ = require('jquery');
const Backbone = require('backbone');
Backbone.$ = $;

const Elem = require('./element');

var HtmlModel = Elem.Model.extend({
    defaults: {
        name: 'name',
        title: '(no title)',
        element: '(no syntax)',
        error: null,
        status: 'complete',
        stale: false,
        options: {},
    }
});

var HtmlView = Elem.View.extend({
    initialize: function(data) {
        Elem.View.prototype.initialize.call(this, data);
        this.$el.addClass('jmv-results-html');

        if (this.model === null)
            this.model = new HtmlModel();

        this.$head = $('head');
        this.promises = [];

        let doc = this.model.attributes.element;
        for (let ss of doc.stylesheets) {
            let url = 'module/' + ss;
            let promise = this._insertSS(url);
            this.promises.push(promise);
        }

        for (let script of doc.scripts)
            this.$head.append('<script src="module/' + script + '" class="module-asset"></script>');

        this.render();
    },

    type: function() {
        return 'Html';
    },

    label: function() {
        return _('Html');
    },

    render: function() {
        this.$head.find('.module-asset').remove();
        let doc = this.model.attributes.element;

        if (doc.content === '')
            return;

        this.ready = Promise.all(this.promises).then(() => {
            let $content = this.$el.find('.content');

            if ($content.length > 0) {
                this.$el.find('a[href]').off('click');
                $content.html(doc.content);
            } else {
                $content = $(`<div class="content">${doc.content}</div>`);
                this.addContent($content);
            }

            // Add accordion structure if "accordion" property is present in content
            if (doc.content.includes('class="accordion"')) {
                let accordions = $content.find('.accordion');
                // Create the button and accordion panel with animated SVG (+)
                const accordionHTML = `
                    <style>
                        .accordion {
                            background-color: #3e6da9;
                            color: white;
                            cursor: pointer;
                            padding: 8px 15px;
                            width: 100%;
                            border: none;
                            text-align: justify;
                            outline: none;
                            font-size: 14px;
                            transition: 0.4s;
                            display: flex;
                            align-items: center;
                            position: relative;
                            border-top-left-radius: 8px;
                            border-top-right-radius: 8px;
                            gap: 10px;
                            box-sizing: border-box;

                        }
                        .accordion svg {
                            transition: fill 0.4s;
                        }
                        .accordion svg .circle {
                            fill: white;
                        }
                        .accordion svg .horizontal,
                        .accordion svg .vertical {
                            fill: #3e6da9;
                            transition: transform 0.8s ease-in-out;
                            transform-origin: center;
                        }
                        .accordion.active svg .vertical {
                            transform: scaleY(0);
                        }
                        .accordion-panel {
                            max-height: 0;
                            overflow: hidden;
                            padding-left: 10px;
                            padding-right: 10px;
                            transition: max-height 0.6s ease-out;
                            border-bottom-left-radius: 8px;
                            border-bottom-right-radius: 8px;
                            border-bottom: 3px solid #3e6da9;
                            box-sizing: border-box;
                        }
                        .accordion-panel.active {
                            max-height: 500px;
                            transition: max-height 0.6s ease-in;
                        }
                        .accordion-panel p,
                        .accordion-panel div {
                            color: black;
                            background-color: white;
                        }
                    </style>
                    <button class="accordion">
                        <svg width="20" height="18" viewBox="0 0 24 24">
                            <circle class="circle" cx="12" cy="12" r="11" />
                            <rect class="horizontal" x="5" y="11" width="15" height="3" />
                            <rect class="vertical" x="11" y="5" width="3" height="15" />
                        </svg>
                        <span style="font-size: 16px;">${this.model.attributes.title}</span>
                    </button>
                    <div class="accordion-panel">${doc.content}</div>
                    <script>
                        var acc = document.getElementsByClassName("accordion");
                        var i;
                        for (i = 0; i < acc.length; i++) {
                            acc[i].addEventListener("click", function() {
                                this.classList.toggle("active");
                                var panel = this.nextElementSibling;
                                if (panel.style.maxHeight) {
                                    panel.style.maxHeight = null;
                                } else {
                                    panel.style.maxHeight = panel.scrollHeight + "px";
                                }
                            });
                        }
                    </script>
                `;
                $content.html(accordionHTML);
            }
            this.$el.find('a[href]').on('click', (event) => this._handleLinkClick(event));
        });
    },

    _handleLinkClick: function(event) {
        let href = $(event.target).attr('href');
        window.openUrl(href);
    },

    _insertSS: function(url) {
        return new Promise((resolve) => {
            $.get(url, (data) => {
                this.$head.append('<style class="module-asset">' + data + '</style>');
                resolve(data);
            }, 'text');
        });
    }
});

module.exports = { Model: HtmlModel, View: HtmlView };

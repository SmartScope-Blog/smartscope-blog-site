// Mermaid initialization for MkDocs
document.addEventListener('DOMContentLoaded', function() {
    // Check if mermaid is loaded
    if (typeof mermaid !== 'undefined') {
        // Initialize mermaid with configuration
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
            },
            gitGraph: {
                theme: 'base',
                themeVariables: {
                    primaryColor: '#009688',
                    primaryTextColor: '#ffffff',
                    primaryBorderColor: '#00695c',
                    lineColor: '#757575',
                    secondaryColor: '#e0f2f1',
                    tertiaryColor: '#ffffff',
                }
            },
            sequence: {
                diagramMarginX: 50,
                diagramMarginY: 10,
                actorMargin: 50,
                width: 150,
                height: 65,
                boxMargin: 10,
                boxTextMargin: 5,
                noteMargin: 10,
                messageMargin: 35,
                wrap: false,
                mirrorActors: true,
                bottomMarginAdj: 1,
                useMaxWidth: true,
            }
        });

        // Support for dark mode
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-md-color-scheme') {
                    const scheme = document.body.getAttribute('data-md-color-scheme');
                    const theme = scheme === 'slate' ? 'dark' : 'default';
                    
                    // Re-initialize mermaid with new theme
                    mermaid.initialize({
                        startOnLoad: true,
                        theme: theme,
                        flowchart: {
                            useMaxWidth: true,
                            htmlLabels: true,
                        }
                    });
                    
                    // Re-render all mermaid diagrams
                    const mermaidElements = document.querySelectorAll('.mermaid');
                    mermaidElements.forEach(function(element) {
                        element.removeAttribute('data-processed');
                    });
                    mermaid.init();
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-md-color-scheme']
        });
    }
});
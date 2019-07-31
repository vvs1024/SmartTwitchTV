//Spacing for reease maker not trow erros frm jshint
var IMG_404_GAME = "data:image/png;base64,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";

var IMG_404_LOGO = "data:image/png;base64,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";

var IMG_404_VIDEO = "data:image/png;base64,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";

var IMG_404_BANNER = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";

var IMG_404_LOGO_TEMP = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAABHNCSVQICAgIfAhkiAAAAXRJREFUeJztwTEBAAAAwqD1T20MH6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/gZ/twABJJA/XAAAAABJRU5ErkJggg==";

//empty
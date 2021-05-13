//
// Member display
//
function Member(parentElem, c, you, name) {
    //
    // Delcare variables
    //
    let _me = this;
    let _c = c;
    let _you = you;
    let _name = name;

    let _parentElem = parentElem;

    //
    // Construct ui
    //
    let _container = document.createElement('div'); // Container div
    _parentElem.appendChild(_container);
    _container.className = 'member'
    // Icon
    let _icon = document.createElement('div');
    _container.appendChild(_icon);
    _icon.className = 'material-icons';
    if (you) {
        _icon.textContent = 'account_circle';
    } else {
        _icon.textContent = 'perm_identity';
    }
    // Display name
    let _displayName = document.createElement('span');
    _container.appendChild(_displayName);
    _displayName.textContent = _name;

    //
    // Delcare public functions
    //
    this.RemoveUi = function() {
        _parentElem.removeChild(_container);
    }

    this.SetName = function(name) {
        _name = name;
        _displayName.textContent = _name;
    }

    this.GetName = function() {
        return _name;
    }

    // Init

}
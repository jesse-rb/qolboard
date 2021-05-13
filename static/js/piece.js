//
// Piece prototype
//
function Piece(canvas, parentElem, startX, startY, ctx, miniMapCtx, color, size, shadowColor, shadowBlur) {
    //
    // Delcare variables
    //
    let _c = canvas;
    let _me = this;

    let _ctx = ctx;
    let _miniMapCtx = miniMapCtx;

    let _color = color;
    let _size = size;
    let _shadowColor = shadowColor;
    let _shadowBlur = parseInt(shadowBlur);

    let _xPath = [];
    let _yPath = [];

    let _scaleFactor = 1;
    let _moveStrength = 1;

    //
    // Initialize piece ui
    //

    // Popup container div
    let _popup = document.createElement('div');
    parentElem.appendChild(_popup);
    _popup.className = 'popup hidden';
    // Delete fieldset
    _popup.appendChild(document.createElement('fieldset'));
    _popup.lastChild.className = 'controls-group';
    _popup.lastChild.appendChild(document.createElement('legend'));
    _popup.lastChild.lastChild.textContent = 'other';
    // Delete button
    _popup.lastChild.appendChild(document.createElement('div'));
    _popup.lastChild.lastChild.appendChild(document.createElement('label'));
    _popup.lastChild.lastChild.lastChild.setAttribute('for', 'popup_delete');
    _popup.lastChild.lastChild.lastChild.textContent = 'delete';
    let _popupDelete = document.createElement('button');
    _popup.lastChild.lastChild.appendChild(_popupDelete);
    _popupDelete.setAttribute('id', 'popup_delete');
    _popupDelete.className = 'button material-icons'
    _popupDelete.textContent = 'delete'
    _popupDelete.addEventListener('click', function(e) {
        let removeIndex = _c.Remove(_me);
        _c.SendDelete(removeIndex);
    }, false);
    // Color fieldset
    _popup.appendChild(document.createElement('fieldset'));
    _popup.lastChild.className = 'controls-group';
    _popup.lastChild.appendChild(document.createElement('legend'));
    _popup.lastChild.lastChild.textContent = 'color';
    // Base color
    _popup.lastChild.appendChild(document.createElement('div'));
    _popup.lastChild.lastChild.appendChild(document.createElement('label'));
    _popup.lastChild.lastChild.lastChild.setAttribute('for', 'popup_base_color');
    _popup.lastChild.lastChild.lastChild.textContent = 'stroke color';
    let _popupBaseColor = document.createElement('input');
    _popup.lastChild.lastChild.appendChild(_popupBaseColor);
    _popupBaseColor.setAttribute('id', 'popup_base_color');
    _popupBaseColor.setAttribute('type', 'color');
    _popupBaseColor.value = _color;
    _popupBaseColor.addEventListener('change', function(e) {
        _color = e.target.value;
        _c.RefreshSection(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight());
        _c.SendUpdate(_me);
    }, false);
    // Weight fieldset
    _popup.appendChild(document.createElement('fieldset'));
    _popup.lastChild.className = 'controls-group';
    _popup.lastChild.appendChild(document.createElement('legend'));
    _popup.lastChild.lastChild.textContent = 'weight';
    // Stroke size
    _popup.lastChild.appendChild(document.createElement('div'));
    _popup.lastChild.lastChild.appendChild(document.createElement('label'));
    _popup.lastChild.lastChild.lastChild.setAttribute('for', 'popup_stroke_size');
    _popup.lastChild.lastChild.lastChild.textContent = 'stroke size';
    let _popupStrokeSize = document.createElement('input');
    _popup.lastChild.lastChild.appendChild(_popupStrokeSize);
    _popupStrokeSize.setAttribute('id', 'popup_stroke_size');
    _popupStrokeSize.setAttribute('type', 'range');
    _popupStrokeSize.setAttribute('min', '1');
    _popupStrokeSize.setAttribute('max', '100');
    _popupStrokeSize.setAttribute('value', _size);
    _popupStrokeSize.addEventListener('change', function(e) {
        _c.ClearPiece(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight(), _me);
        _size = parseInt(e.target.value);
        _c.RefreshSection(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight());
        _c.SendUpdate(_me);
    }, false);
    // Scale fieldset
    _popup.appendChild(document.createElement('fieldset'));
    _popup.lastChild.className = 'controls-group';
    _popup.lastChild.appendChild(document.createElement('legend'));
    _popup.lastChild.lastChild.textContent = 'scale';
    // Scale strength
    _popup.lastChild.appendChild(document.createElement('div'));
    _popup.lastChild.lastChild.appendChild(document.createElement('label'));
    _popup.lastChild.lastChild.lastChild.setAttribute('for', 'popup_scale_strength');
    _popup.lastChild.lastChild.lastChild.textContent = 'scale strength';
    let _popupScaleStrengthSlider = document.createElement('input');
    _popup.lastChild.lastChild.appendChild(_popupScaleStrengthSlider);
    _popupScaleStrengthSlider.setAttribute('id', 'popup_scale_strength');
    _popupScaleStrengthSlider.setAttribute('type', 'range');
    _popupScaleStrengthSlider.setAttribute('min', '1.01');
    _popupScaleStrengthSlider.setAttribute('max', '2');
    _popupScaleStrengthSlider.setAttribute('step', '0.01')
    _popupScaleStrengthSlider.setAttribute('value', '1.5');
    _popupScaleStrengthSlider.addEventListener('change', function(e) {
        _scaleFactor = parseFloat(e.target.value);
    }, false);
    // Scale down button
    _popup.lastChild.appendChild(document.createElement('div'));
    _popup.lastChild.lastChild.appendChild(document.createElement('label'));
    _popup.lastChild.lastChild.lastChild.setAttribute('for', 'popup_scale_down');
    _popup.lastChild.lastChild.lastChild.textContent = 'scale down';
    let _popupScaleDownButton = document.createElement('button');
    _popup.lastChild.lastChild.appendChild(_popupScaleDownButton);
    _popupScaleDownButton.setAttribute('id', 'popup_scale_down');
    _popupScaleDownButton.className = 'material-icons button'
    _popupScaleDownButton.textContent = 'remove';
    _popupScaleDownButton.addEventListener('click', function(e) {
        _c.ClearPiece(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight(), _me);
        let diffX = _xPath[0];
        let diffY = _yPath[0];
        for (let i = 0; i < _xPath.length; i++) {
            _xPath[i]*=1/_scaleFactor; // Scale
        }
        for (let i = 0; i < _yPath.length; i++) {
            _yPath[i]*=1/_scaleFactor; // Scale
        }
        diffX = diffX-_xPath[0];
        diffY = diffY-_yPath[0];
        moveDown(diffY);
        moveRight(diffX);
        _c.RefreshSection(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight());
        _c.SendUpdate(_me);
    }, false);
    // Scale up button
    _popup.lastChild.appendChild(document.createElement('div'));
    _popup.lastChild.lastChild.appendChild(document.createElement('label'));
    _popup.lastChild.lastChild.lastChild.setAttribute('for', 'popup_scale_up');
    _popup.lastChild.lastChild.lastChild.textContent = 'scale up';
    let _popupScaleUpButton = document.createElement('button');
    _popup.lastChild.lastChild.appendChild(_popupScaleUpButton);
    _popupScaleUpButton.setAttribute('id', 'popup_scale_up');
    _popupScaleUpButton.className = 'material-icons button'
    _popupScaleUpButton.textContent = 'add';
    _popupScaleUpButton.addEventListener('click', function(e) {
        _c.ClearPiece(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight(), _me);
        let diffX = _xPath[0];
        let diffY = _yPath[0];
        for (let i = 0; i < _xPath.length; i++) {
            _xPath[i]*=_scaleFactor; // Scale
        }
        for (let i = 0; i < _yPath.length; i++) {
            _yPath[i]*=_scaleFactor; // Scale
        }
        diffX = diffX-_xPath[0];
        diffY = diffY-_yPath[0];
        moveDown(diffY);
        moveRight(diffX);
        _c.RefreshSection(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight());
        _c.SendUpdate(_me);
    }, false);
    // Move fieldset
    _popup.appendChild(document.createElement('fieldset'));
    _popup.lastChild.className = 'controls-group';
    _popup.lastChild.appendChild(document.createElement('legend'));
    _popup.lastChild.lastChild.textContent = 'move';
    // Move strength
    _popup.lastChild.appendChild(document.createElement('div'));
    _popup.lastChild.lastChild.appendChild(document.createElement('label'));
    _popup.lastChild.lastChild.lastChild.setAttribute('for', 'popup_move_strength');
    _popup.lastChild.lastChild.lastChild.textContent = 'move strength';
    let _popupMoveStrengthSlider = document.createElement('input');
    _popup.lastChild.lastChild.appendChild(_popupMoveStrengthSlider);
    _popupMoveStrengthSlider.setAttribute('id', 'popup_move_strength');
    _popupMoveStrengthSlider.setAttribute('type', 'range');
    _popupMoveStrengthSlider.setAttribute('min', '1');
    _popupMoveStrengthSlider.setAttribute('max', '1000');
    _popupMoveStrengthSlider.setAttribute('step', '1')
    _popupMoveStrengthSlider.setAttribute('value', '25');
    _popupMoveStrengthSlider.addEventListener('change', function(e) {
        _moveStrength = parseInt(e.target.value);
    }, false);
    // Move down button
    _popup.lastChild.appendChild(document.createElement('div'));
    _popup.lastChild.lastChild.appendChild(document.createElement('label'));
    _popup.lastChild.lastChild.lastChild.setAttribute('for', 'popup_move_down');
    _popup.lastChild.lastChild.lastChild.textContent = 'move down';
    let _popupMoveDownButton = document.createElement('button');
    _popup.lastChild.lastChild.appendChild(_popupMoveDownButton);
    _popupMoveDownButton.setAttribute('id', 'popup_move_down');
    _popupMoveDownButton.className = 'material-icons button';
    _popupMoveDownButton.innerHTML = 'south';
    _popupMoveDownButton.addEventListener('click', function(e) {
        _c.ClearPiece(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight(), _me);
        moveDown(_moveStrength);
        _c.RefreshSection(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight());
        _c.SendUpdate(_me);
    }, false);
    // Move up button
    _popup.lastChild.appendChild(document.createElement('div'));
    _popup.lastChild.lastChild.appendChild(document.createElement('label'));
    _popup.lastChild.lastChild.lastChild.setAttribute('for', 'popup_move_up');
    _popup.lastChild.lastChild.lastChild.textContent = 'move up';
    let _popupMoveUpButton = document.createElement('button');
    _popup.lastChild.lastChild.appendChild(_popupMoveUpButton);
    _popupMoveUpButton.setAttribute('id', 'popup_move_up');
    _popupMoveUpButton.className = 'material-icons button';
    _popupMoveUpButton.innerHTML = 'north';
    _popupMoveUpButton.addEventListener('click', function(e) {
        _c.ClearPiece(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight(), _me);
        moveUp(_moveStrength);
        _c.RefreshSection(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight());
        _c.SendUpdate(_me);
    }, false);
    // Move left button
    _popup.lastChild.appendChild(document.createElement('div'));
    _popup.lastChild.lastChild.appendChild(document.createElement('label'));
    _popup.lastChild.lastChild.lastChild.setAttribute('for', 'popup_move_left');
    _popup.lastChild.lastChild.lastChild.textContent = 'move left';
    let _popupMoveLeftButton = document.createElement('button');
    _popup.lastChild.lastChild.appendChild(_popupMoveLeftButton);
    _popupMoveLeftButton.setAttribute('id', 'popup_move_left');
    _popupMoveLeftButton.className = 'material-icons button';
    _popupMoveLeftButton.innerHTML = 'west';
    _popupMoveLeftButton.addEventListener('click', function(e) {
        _c.ClearPiece(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight(), _me);
        moveLeft(_moveStrength);
        _c.RefreshSection(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight());
        _c.SendUpdate(_me);
    }, false);
    // Move right button
    _popup.lastChild.appendChild(document.createElement('div'));
    _popup.lastChild.lastChild.appendChild(document.createElement('label'));
    _popup.lastChild.lastChild.lastChild.setAttribute('for', 'popup_move_right');
    _popup.lastChild.lastChild.lastChild.textContent = 'move right';
    let _popupMoveRightButton = document.createElement('button');
    _popup.lastChild.lastChild.appendChild(_popupMoveRightButton);
    _popupMoveRightButton.setAttribute('id', 'popup_move_right');
    _popupMoveRightButton.className = 'material-icons button';
    _popupMoveRightButton.innerHTML = 'east';
    _popupMoveRightButton.addEventListener('click', function(e) {
        _c.ClearPiece(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight(), _me);
        moveRight(_moveStrength);
        _c.RefreshSection(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight());
        _c.SendUpdate(_me);
    }, false);
    // Experimental fieldset
    _popup.appendChild(document.createElement('fieldset'));
    _popup.lastChild.className = 'controls-group';
    _popup.lastChild.appendChild(document.createElement('legend'));
    _popup.lastChild.lastChild.textContent = 'experimental';
    // Shadow color
    _popup.lastChild.appendChild(document.createElement('div'));
    _popup.lastChild.lastChild.appendChild(document.createElement('label'));
    _popup.lastChild.lastChild.lastChild.setAttribute('for', 'popup_shadow_color');
    _popup.lastChild.lastChild.lastChild.textContent = 'shadow color';
    let _popupShadowColor = document.createElement('input');
    _popup.lastChild.lastChild.appendChild(_popupShadowColor);
    _popupShadowColor.setAttribute('id', 'popup_shadow_color');
    _popupShadowColor.setAttribute('type', 'color');
    _popupShadowColor.value = _shadowColor;
    _popupShadowColor.addEventListener('change', function(e) {
        _shadowColor = e.target.value;
        _c.RefreshSection(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight());
        _c.SendUpdate(_me);
    }, false);
    // Shadow blur
    _popup.lastChild.appendChild(document.createElement('div'));
    _popup.lastChild.lastChild.appendChild(document.createElement('label'));
    _popup.lastChild.lastChild.lastChild.setAttribute('for', 'popup_shadow_blur');
    _popup.lastChild.lastChild.lastChild.textContent = 'shadow blur';
    let _popupShadowBlur = document.createElement('input');
    _popup.lastChild.lastChild.appendChild(_popupShadowBlur);
    _popupShadowBlur.setAttribute('id', 'popup_shadow_blur');
    _popupShadowBlur.setAttribute('type', 'range');
    _popupShadowBlur.setAttribute('min', '0');
    _popupShadowBlur.setAttribute('max', '100');
    _popupShadowBlur.setAttribute('value', _shadowBlur);
    _popupShadowBlur.addEventListener('change', function(e) {
        _c.ClearPiece(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight(), _me);
        _shadowBlur = parseInt(e.target.value);
        _c.RefreshSection(_me.GetLowestX(), _me.GetLowestY(), _me.GetWidth(), _me.GetHeight());
        _c.SendUpdate(_me);
    }, false);

    //
    // Declare private functions
    //
    let moveLeft = function(moveStr) {
        for (let i = 0; i < _xPath.length; i++) {
            _xPath[i]-=moveStr; // Move each point right
        }
    }
    let moveRight = function(moveStr) {
        for (let i = 0; i < _xPath.length; i++) {
            _xPath[i]+=moveStr; // Move each point right
        }
    }
    let moveUp = function(moveStr) {
        for (let i = 0; i < _xPath.length; i++) {
            _yPath[i]-=moveStr; // Move each point right
        }
    }
    let moveDown = function(moveStr) {
        for (let i = 0; i < _xPath.length; i++) {
            _yPath[i]+=moveStr; // Move each point right
        }
    }

    let showSettings = function(ctx, i) {
        ctx.beginPath();
        ctx.moveTo(_xPath[i], _yPath[i]);
        ctx.lineTo(_xPath[i+1], _yPath[i+1]);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'bevel';
        ctx.strokeStyle = _color;
        ctx.fillStyle = _color;
        ctx.lineWidth = _size;
        ctx.shadowColor = _shadowColor;
        ctx.shadowBlur = _shadowBlur;
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }

    //
    // Delcare public functions
    //
    this.ShowUi = function() {
        _popup.classList.remove('hidden')
    }

    this.HideUi = function() {
        _popup.classList.add('hidden')
    }

    this.InBound = function(pointX, pointY) {
        for (let i = 0; i < _xPath.length; i++) {
            if (pointX > _xPath[i]-((_size/2)+(_shadowBlur/2)) &&
                pointX < _xPath[i]+(_size/2)+(_shadowBlur/2) &&
                pointY > _yPath[i]-((_size/2)+(_shadowBlur/2)) &&
                pointY < _yPath[i]+(_size/2)+(_shadowBlur/2)) {
                return true;
            }
        }
        return false;
    }

    this.Record = function(x, y) {
        _xPath.push(x);
        _yPath.push(y);
    }

    this.GetSize = function() {
        return _size;
    }
    this.GetColor = function() {
        return _color;
    }
    this.GetShadowColor = function() {
        return _shadowColor;
    }
    this.GetShadowBlur = function() {
        return _shadowBlur;
    }

    this.GetXPath = function() {
        return _xPath;
    }
    this.GetYPath = function() {
        return _yPath;
    }

    this.GetLowestX = function() {
        let offset = (_shadowBlur)+(_size);
        let lowest = _xPath[0];
        for (x of _xPath) {
            if (x < lowest) { lowest = x }
        }
        return lowest-offset-(offset/2);
    }
    this.GetLowestY = function() {
        let offset = (_shadowBlur)+(_size);
        let lowest = _yPath[0];
        for (y of _yPath) {
            if (y < lowest) { lowest = y }
        }
        return lowest-offset-(offset/2);
    }

    this.GetWidth = function() {
        let offset = (_shadowBlur)+(_size);
        let lowest = _xPath[0];
        let highest = _xPath[0];
        for (x of _xPath) {
            if (x < lowest) { lowest = x }
            if (x > highest) {highest = x }
        }
        return ((highest+offset)-(lowest-offset))+(offset);
    }
    this.GetHeight = function() {
        let offset = (_shadowBlur)+(_size);
        let lowest = _yPath[0];
        let highest = _yPath[0];
        for (y of _yPath) {
            if (y < lowest) { lowest = y }
            if (y > highest) {highest = y }
        }
        return ((highest+offset)-(lowest-offset))+(offset);
    }

    this.Show = function() {
        _ctx.beginPath();
        for (let i = 0; i < _xPath.length; i++) {
            showSettings(_ctx, i);
        }
        _ctx.closePath();
    }

    this.ShowLast = function() {
        showSettings(_ctx, _xPath.length-2);
    }

    this.ShowMiniMap = function() {
        _miniMapCtx.beginPath();
        for (let i = 0; i < _xPath.length; i++) {
            showSettings(_miniMapCtx, i);
        }
        _miniMapCtx.closePath();
    }

    this.ShowMiniMapLast = function() {
        showSettings(_miniMapCtx, _xPath.length-2);
    }

    this.Serialize = function() {
        return {xPath: _xPath, yPath: _yPath,
        color: _color, size: _size,
        shadowColor: _shadowColor, shadowBlur: _shadowBlur};
    }

    //
    // Init
    //
    _scaleFactor = parseFloat(_popupScaleStrengthSlider.value);
    _moveStrength = parseInt(_popupMoveStrengthSlider.value);

    this.Record(startX, startY);
}

//
// Declare static functions
//
Piece.prototype.deserialize = function(canvas, parentElem, ctx, miniMapCtx, p) {
    // Create new piece with previous initial fields
    newP = new Piece(canvas, parentElem, p.xPath[0], p.yPath[0],
        ctx, miniMapCtx, p.color, p.size,
        p.shadowColor, p.shadowBlur);
    
    // Restore xPath and yPath
    for (let i = 1; i < p.xPath.length; i++) {
        newP.Record(p.xPath[i], p.yPath[i]);
    }

    return newP;
}
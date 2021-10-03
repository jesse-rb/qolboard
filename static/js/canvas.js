//
// Canvas prototype
//
function Canvas(toggleNotifications, notificationsBar, joinNotifIncoming, joinNotifOutgoing, membersContainer, displayName, setDisplayName, codeInput, joinButton, codeDisplay,
    canvasContainer, canvasScroll, canvas, miniMap, ctx, 
    canvasWidthSlider, canvasHeightSlider, canvasZoomSlider, canvasBackgroundColorPicker,
    pieceColorPicker, pieceSizeSlider, pieceShadowColorPicker, pieceShadowBlurSlider, drawTool, selectTool, deleteTool) {
    //
    // Declare private variables
    //
    let _me = this;
    let _code = '';

    let _codeInput = codeInput;
    let _joinButton = joinButton;
    let _codeDisplay = codeDisplay;

    let _toggleNotifications = toggleNotifications;
    let _notificationsBar = notificationsBar
    let _joinNotifIncoming = joinNotifIncoming;
    let _joinNotifOutgoing = joinNotifOutgoing;

    let _membersContainer = membersContainer;
    let _displayName = displayName;
    let _setDisplayName = setDisplayName;

    let _canvasContainer = canvasContainer;
    let _canvasScroll = canvasScroll;
    let _canvas = canvas;
    let _miniMap = miniMap;
    let _ctx = _canvas.getContext(ctx);
    let _miniMapCtx = _miniMap.getContext(ctx);

    let _miniMapMouseDown = false;

    let _canvasWidthSlider = canvasWidthSlider;
    let _canvasHeightSlider = canvasHeightSlider;
    let _canvasBackgroundColorPicker = canvasBackgroundColorPicker;

    let _pieces = [];
    let _pieceInProgressIndex = 0;
    
    let _members = [];
    let _member = new Member(_membersContainer, _me, true, 'anonymous');

    // Mouse props
    let _mouseDown = false;
    let _x = 0;
    let _y = 0;
    let _prevX = 0;
    let _prevY = 0;
    let _prevMiniMapX = 0;
    let _prevMiniMapY = 0;

    let _touchEvent = false;

    let _scaleWidthDownFactor = 1;
    let _scaleWidthUpFactor = 1;
    let _scaleHeightDownFactor = 1;
    let _scaleHeightUpFactor = 1;

    let _toolElements = new Map();
    _toolElements.set('draw', drawTool);
    _toolElements.set('select', selectTool);
    _toolElements.set('delete', deleteTool);
    let _activeTool = '';

    //
    // Declare private functions
    //

    let calcScaleFactors = function() {
        _scaleWidthDownFactor = _miniMap.width/_canvas.width;
        _scaleWidthUpFactor = _canvas.width/_miniMap.width;
        _scaleHeightDownFactor = _miniMap.height/_canvas.height;
        _scaleHeightUpFactor = _canvas.height/_miniMap.height;
    }

    let clearCanvas = function() {
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    }
    let clearMiniMap = function() {
        _miniMapCtx.clearRect(0, 0, _miniMap.width*_scaleWidthUpFactor, _miniMap.height*_scaleHeightUpFactor);
    }

    let drawBackgroundColor = function() {
        _ctx.fillStyle = _canvasBackgroundColorPicker.value;
        _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
    }
    let drawMiniMapBackgroundColor = function() {
        _miniMapCtx.fillStyle = _canvasBackgroundColorPicker.value;
        _miniMapCtx.fillRect(0, 0, _miniMap.width*_scaleWidthUpFactor, _miniMap.height*_scaleHeightUpFactor);
    }

    let drawMiniMapPieces = function() {
        // Draw each piece
        for (let i = 0; i < _pieces.length; i++) {
            _pieces[i].ShowMiniMap();
        }
    }

    let reScaleMiniMap = function() {
        _miniMapCtx.scale(_scaleWidthUpFactor, _scaleHeightUpFactor); // First revert to original scale

        // Calc new scale factors
        calcScaleFactors();

        _miniMapCtx.scale(_scaleWidthDownFactor, _scaleHeightDownFactor); // Scale mini map initially
        drawMiniMap();
    }

    let invertColor = function(c) {
        // Convert color to integer
        c = c.substring(1);
        c = parseInt(c, 16);
        c = 0xFFFFFF ^ c; // Invert using xor
        // onvert back to string
        c = c.toString(16); // Ensure only 256 bits
        c = ("000000" + c).slice(-6); // Add padded zeros
        c = "#" + c;
        return c;
    }

    let drawCanvas = function() {
        clearCanvas();
        drawBackgroundColor();
        drawPieces();

        _me.SaveSession();
    }

    let drawMiniMap = function() {
        // Clear mini map
        clearMiniMap();
        // Draw background color
        drawMiniMapBackgroundColor();
        // Draw mini map pieces
        drawMiniMapPieces();
    }

    let clearCanvasPiece = function(x, y, width, height, clearPiece) {
        // Draw only section background
        _ctx.shadowBlur = 0;
        _ctx.fillStyle = _canvasBackgroundColorPicker.value;
        _ctx.fillRect(x, y, width, height);

        // Only redraw pieces that are inbound of section
        for (p of _pieces) {
            if (p === clearPiece) { continue; }
            x2 = p.GetLowestX();
            width2 = p.GetWidth();
            y2 = p.GetLowestY();
            height2 = p.GetHeight();
            if ((x < x2+width2) && (x+width > x2) && (y < y2+height2) && (y+height > y2)) {
                p.Show();
            }
        }
    }
    let clearMiniMapPiece = function(x, y, width, height, clearPiece) {
        // Draw only section background
        _miniMapCtx.shadowBlur = 0;
        _miniMapCtx.fillStyle = _canvasBackgroundColorPicker.value;
        _miniMapCtx.fillRect(x, y, width, height);
        // Only redraw pieces that are inbound of section
        for (p of _pieces) {
            if (p === clearPiece) { continue; }
            x2 = p.GetLowestX();
            width2 = p.GetWidth();
            y2 = p.GetLowestY();
            height2 = p.GetHeight();
            if ((x < x2+width2) && (x+width > x2) && (y < y2+height2) && (y+height > y2)) {
                p.ShowMiniMap();
            }
        }
    }

    let reDrawCanvasSection = function(x, y, width, height) {
        // Draw only section background
        _ctx.shadowBlur = 0;
        _ctx.fillStyle = _canvasBackgroundColorPicker.value;
        _ctx.fillRect(x, y, width, height);

        // Only redraw pieces that are inbound of section
        for (p of _pieces) {
            x2 = p.GetLowestX();
            width2 = p.GetWidth();
            y2 = p.GetLowestY();
            height2 = p.GetHeight();
            if ((x < x2+width2) && (x+width > x2) && (y < y2+height2) && (y+height > y2)) {
                p.Show();
            }
        }
    }
    let reDrawMiniMapSection = function(x, y, width, height) {
        // Draw only section background
        _miniMapCtx.shadowBlur = 0;
        _miniMapCtx.fillStyle = _canvasBackgroundColorPicker.value;
        _miniMapCtx.fillRect(x, y, width, height);
        // Only redraw pieces that are inbound of section
        for (p of _pieces) {
            x2 = p.GetLowestX();
            width2 = p.GetWidth();
            y2 = p.GetLowestY();
            height2 = p.GetHeight();
            if ((x < x2+width2) && (x+width > x2) && (y < y2+height2) && (y+height > y2)) {
                p.ShowMiniMap();
            }
        }
    }

    let drawPieces = function() {
        for (let i = 0; i < _pieces.length; i++) {
            _pieces[i].Show(); // Draw each piece
        }
    }

    let restoreMember = function(stateJSON) {
        _member.RemoveUi();
        _member = new Member(_membersContainer, _me, true, stateJSON.member);
    }

    let refreshMembers = function(message) {
        if (message.members != null) {
            for (m of _members) {
                m.RemoveUi();
            }
            _members = [];
            for (m of message.members) {
                _members.push(new Member(_membersContainer, _me, false, m));
            }
        }
    }

    let restoreCanvasStateJSON = function(stateJSON) {
        _canvas.width = stateJSON.width;
        _canvasWidthSlider.value = stateJSON.width;
        _canvas.height = stateJSON.height;
        _canvasHeightSlider.value = stateJSON.height;
        _canvasBackgroundColorPicker.value = stateJSON.backgroundColor;

        // Deserialize piece prototype based objects
        _pieces = [];
        for (p of stateJSON.pieces) {
            _pieces.push(Piece.prototype.deserialize(_me, _canvasContainer, _ctx, _miniMapCtx, p));
        }
    }

    let restoreFromServer = function(message) {
        refreshMembers(message);
        restoreCanvasStateJSON(message.canvas);
        _me.Refresh();
    }

    let setActiveTool = function(tool) {
        // Show through ui that this tool is active
        for (let [key] of _toolElements) {
            _toolElements.get(key).classList.remove('active-tool');
        }
        _toolElements.get(tool).classList.add('active-tool');
        // Set active tool
        _activeTool = tool
    }

    let showSelectUi = function() {
        // Show only selected pieces ui
        for (let i = 0; i < _pieces.length; i++) {
            if (_pieces[i].InBound(_x, _y)) {
                _canvas.style.cursor = 'grab';
                _pieces[i].ShowUi();
            } else {
                _pieces[i].HideUi();
            }
        }
    }

    let deleteSelectedPiece = function() {
        // Show only selected pieces ui
        for (let i = 0; i < _pieces.length; i++) {
            if (_pieces[i].InBound(_x, _y)) {
                _me.Remove(_pieces[i]);
                _me.SendDelete(i);
            }
        }
    }

    let toggleNotifBar = function() {
        _toggleNotifications.classList.remove('animation-new-notif');
    }

    //
    // Declare event listeners
    //
    _toolElements.get('draw').addEventListener('click', function(e) {
        setActiveTool('draw');
    }, false);
    _toolElements.get('select').addEventListener('click', function(e) {
        setActiveTool('select');
    }, false);
    _toolElements.get('delete').addEventListener('click', function(e) {
        setActiveTool('delete');
    }, false);

    _toggleNotifications.addEventListener('click', toggleNotifBar, false);

    _joinButton.addEventListener('click', function() {
        _toggleNotifications.classList.add('animation-new-notif');
        let code = _codeInput.value;
        let state = _me.SaveStateJSON();
        let message = {desc: 'request-join-room', code: _codeInput.value, canvas: state, member: _member.GetName()}
        _socket.send(JSON.stringify(message));
        
        // Container
        let container = document.createElement('div');
        _joinNotifOutgoing.appendChild(container);
        container.className = 'notif';
        // Info
        let info = document.createElement('span');
        container.appendChild(info)
        info.textContent = 'Join request to';
        // Code
        let room = document.createElement('span');
        container.appendChild(room);
        room.textContent = code;
        // Cancel button
        let cancel = document.createElement('button');
        container.appendChild(cancel);
        cancel.className = 'button material-icons'
        cancel.textContent = 'cancel'
        cancel.addEventListener('click', function() {
            _toggleNotifications.classList.remove('animation-new-notif');
            let m = {desc: 'cancel-join-room', code: room.textContent}
            _socket.send(JSON.stringify(m));
            _joinNotifOutgoing.removeChild(container);
        }, false);
    }, false);

    _setDisplayName.addEventListener('click', function(e) {
        _member.SetName(_displayName.value);
        _me.SaveSession();
        let message = {desc: 'set-member-name', code: _code, member: _displayName.value}
        _socket.send(JSON.stringify(message));
    }, false);

    _canvasWidthSlider.addEventListener('change', function (e) {
        _canvas.width = e.target.value; // Set canvas width
        drawCanvas();
        // Rescale mini map
        reScaleMiniMap();

        let state = _me.SaveStateJSON();
        let message = {desc: 'repaint-canvas', code: _code, canvas: state}
        _socket.send(JSON.stringify(message));
    }, false);

    _canvasHeightSlider.addEventListener('change', function (e) {
        _canvas.height = e.target.value; // Set canvas height
        drawCanvas();
        // Rescale mini map
        reScaleMiniMap();

        let state = _me.SaveStateJSON();
        let message = {desc: 'repaint-canvas', code: _code, canvas: state}
        _socket.send(JSON.stringify(message));
    }, false);

    _canvasBackgroundColorPicker.addEventListener('change', function (e) {
        _me.Refresh();
        let state = _me.SaveStateJSON();
        let message = {desc: 'repaint-canvas', code: _code, canvas: state}
        _socket.send(JSON.stringify(message));
    }, false);

    _canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    }, false);

    _canvas.addEventListener('mousedown', function (e) {
        if (!_touchEvent) {
            _mouseDown = true;
            if (_activeTool == 'draw') {
                _pieceInProgressIndex = _pieces.length;
                _pieces.push(new Piece(_me, _canvasContainer, _x, _y, _ctx, _miniMapCtx, pieceColorPicker.value, parseInt(pieceSizeSlider.value),
                    pieceShadowColorPicker.value, parseInt(pieceShadowBlurSlider.value)));
                _pieces[_pieceInProgressIndex].Record(_x, _y);
                _pieces[_pieceInProgressIndex].Show();
                _pieces[_pieceInProgressIndex].ShowMiniMap();
                _ctx.beginPath();
                _miniMapCtx.beginPath();
            } else if (_activeTool == 'select') {
                showSelectUi();
            } else if (_activeTool == 'delete') {
                deleteSelectedPiece();
            }
        }
    }, false);

    _canvas.addEventListener('mouseup', function (e) {
        if (_mouseDown && _activeTool == 'draw') {
            _ctx.closePath();
            _miniMapCtx.closePath();
            _me.SaveSession();
            let state = _me.SaveStateJSON();
            let message = {desc: 'add-piece', code: _code, piece: _pieces[_pieceInProgressIndex].Serialize(), canvas: state}
            _socket.send(JSON.stringify(message))
        }
        _mouseDown = false;
        if (e.button != 0) {
            _canvas.style.cursor = 'crosshair';
        }
        if (_activeTool == 'select') {
            _canvas.style.cursor = 'crosshair';
        }
    }, false);

    _canvas.addEventListener('mouseout', function (e) {
        if (_mouseDown && _activeTool == 'draw') {
            _ctx.closePath();
            _miniMapCtx.closePath();
            _me.SaveSession();
            let state = _me.SaveStateJSON();
            let message = {desc: 'add-piece', code: _code, piece: _pieces[_pieceInProgressIndex].Serialize(), canvas: state}
            _socket.send(JSON.stringify(message))
        }
        _mouseDown = false;
    }, false);

    _canvas.addEventListener('mousemove', function (e) {
        // Calc canvas mouseX and mouseY
        _x = e.clientX - _canvas.offsetLeft + _canvasScroll.scrollLeft + document.documentElement.scrollLeft-5;
        _y = e.clientY - _canvas.offsetTop + _canvasScroll.scrollTop + document.documentElement.scrollTop-5;

        if (_activeTool == 'draw') {
            if (_x-1 > _prevX || _x+1 < _prevX || _y-1 > _prevY || _y+1 < _prevY) {
                _prevX = _x;
                _prevY = _y;
                // Record and show if mouse down
                if (_pieces.length > 0 && _mouseDown) {
                    let p = _pieces[_pieceInProgressIndex];
                    p.Record(_x, _y);
                    p.ShowLast();
                    p.ShowMiniMapLast();
                    _me.SaveSession();
                }
            }
        } else if (_mouseDown && _activeTool == 'select') {
            showSelectUi();
        } else if (_mouseDown && _activeTool == 'delete') {
            deleteSelectedPiece();
        }
    }, false);

    // Toggle mouse down on mini map
    _miniMap.addEventListener('mousedown', function (e) {
        _miniMapMouseDown = true;
    }, false);
    // Toggle mouse down on mini map
    _miniMap.addEventListener('mouseup', function (e) {
        _miniMapMouseDown = false;
    }, false);
    // Toggle mouse down on mini map
    _miniMap.addEventListener('mouseout', function (e) {
        _miniMapMouseDown = false;
    }, false);


    // Mouse move on mini map
    _miniMap.addEventListener('mousemove', function (e) {
        // Calc x and y position of mouse
        let x = e.clientX - _miniMap.offsetLeft + document.documentElement.scrollLeft-5;
        let y = e.clientY - _miniMap.offsetTop + document.documentElement.scrollTop-5;
        if (_miniMapMouseDown) {
            // Teleport main canvas to x and y pos
            _canvasScroll.scrollLeft = x*_scaleWidthUpFactor - (_canvasScroll.offsetWidth/2);
            _canvasScroll.scrollTop = y*_scaleHeightUpFactor - (_canvasScroll.offsetHeight/2);
        }
    }, false);

    // Support for touch screen drawing and mini map
    _canvas.addEventListener('touchstart', function (e) {
        _touchEvent = true;
        let t = e.touches[0] || e.changedTouches[0];
        _x = t.pageX - _canvas.offsetLeft + _canvasScroll.scrollLeft;
        _y = t.pageY - _canvas.offsetTop + _canvasScroll.scrollTop;
        if (_activeTool == 'draw') {            
            _pieceInProgressIndex = _pieces.length;
            _pieces.push(new Piece(_me, _canvasContainer, _x, _y, _ctx, _miniMapCtx, pieceColorPicker.value, parseInt(pieceSizeSlider.value),
                pieceShadowColorPicker.value, parseInt(pieceShadowBlurSlider.value)));
            _pieces[_pieceInProgressIndex].Record(_x, _y);
            _pieces[_pieceInProgressIndex].Show();
            _pieces[_pieceInProgressIndex].ShowMiniMap();
            _ctx.beginPath();
            _miniMapCtx.beginPath();
        } else if (_activeTool == 'select') {
            showSelectUi();
        } else if (_activeTool == 'delete') {
            deleteSelectedPiece();
        }
    }, false);

    _canvas.addEventListener('touchend', function (e) {
        if (_activeTool == 'draw') {
            _ctx.closePath();
            _miniMapCtx.closePath();
            let state = _me.SaveStateJSON();
            let message = {desc: 'add-piece', code: _code, piece: _pieces[_pieceInProgressIndex].Serialize(), canvas: state}
            _socket.send(JSON.stringify(message))
            _me.SaveSession();
        }
        setTimeout(function() {_touchEvent = false;}, 1)
    }, false);

    _canvas.addEventListener('touchmove', function (e) {
        e.preventDefault();
        // Calc canvas touchX and touchY
        let t = e.touches[0] || e.changedTouches[0];
        _x = t.pageX - _canvas.offsetLeft + _canvasScroll.scrollLeft;
        _y = t.pageY - _canvas.offsetTop + _canvasScroll.scrollTop;

        if (_activeTool == 'draw') {
            if (_x-1 > _prevX || _x+1 < _prevX || _y-1 > _prevY || _y+1 < _prevY) {
                _prevX = _x;
                _prevY = _y;
                // Record and show if mouse down
                if (_pieces.length > 0) {
                    let p = _pieces[_pieceInProgressIndex];
                    p.Record(_x, _y);
                    p.ShowLast();
                    p.ShowMiniMapLast();
                    _me.SaveSession();
                }
            }
        } else if(_activeTool == 'select') {
            showSelectUi();
        } else if (_activeTool == 'delete') {
            deleteSelectedPiece();
        }
    }, false);

    // Mouse move on mini map
    _miniMap.addEventListener('touchmove', function (e) {
        e.preventDefault();
        // Calc x and y position of touch
        let t = e.touches[0] || e.changedTouches[0];
        let x = t.pageX - _miniMap.offsetLeft;
        let y = t.pageY - _miniMap.offsetTop;
        // Teleport main canvas to x and y pos
        _canvasScroll.scrollLeft = x*_scaleWidthUpFactor - (_canvasScroll.offsetWidth/2);
        _canvasScroll.scrollTop = y*_scaleHeightUpFactor - (_canvasScroll.offsetHeight/2);
    }, false);

    //
    // Declare public methods
    //

    this.Refresh = function() {
        drawCanvas();
        reScaleMiniMap();

        _me.SaveSession();
    }

    this.RefreshSection = function(x, y, width, height) {
        reDrawCanvasSection(x, y, width, height);
        reDrawMiniMapSection(x, y, width, height);

        _me.SaveSession();
    }

    this.ClearPiece = function(x, y, width, height, clearPiece) {
        clearCanvasPiece(x, y, width, height, clearPiece);
        clearMiniMapPiece(x, y, width, height, clearPiece);
    }

    this.SendUpdate = function(p) {
        let state = _me.SaveStateJSON();
        let index = _pieces.indexOf(p);
        let piece = p.Serialize();
        let message = {desc: 'update-piece', code: _code, index: index, piece: piece, canvas: state}
        _socket.send(JSON.stringify(message));
    }

    this.SendDelete = function(index) {
        let state = _me.SaveStateJSON();
        let message = {desc: 'remove-piece', code: _code, index: index, canvas: state}
        console.log('Message: ', message);
        _socket.send(JSON.stringify(message))
    } 

    this.GetCode = function() {
        return _code;
    }
    // Remove a piece
    this.Remove = function(piece) {
        piece.HideUi()
        let i = _pieces.indexOf(piece);
        _pieces.splice(i, 1);
        _me.RefreshSection(piece.GetLowestX(), piece.GetLowestY(), piece.GetWidth(), piece.GetHeight());
        return i // Return index of deletion
    }

    this.RemoveAllPieces = function() {
        // Hide ui of all pieces
        for (p of _pieces) {
            p.HideUi()
        }
        _pieces = [];
        _me.Refresh();
        let state = this.SaveStateJSON();
        let message = {desc: 'repaint-canvas', code: _code, canvas: state}
        _socket.send(JSON.stringify(message));
    }

    this.SaveSession = function() {
        let state = _me.SaveStateJSON();
        window.sessionStorage.setItem('state', JSON.stringify(state));
    }

    this.SaveStateJSON = function() {
        stateJSON = {
            // code: _code,
            pieces: [],
            width: _canvas.width,
            height: _canvas.height,
            backgroundColor: _canvasBackgroundColorPicker.value,

            strokeColor: pieceColorPicker.value,
            strokeWidth: pieceSizeSlider.value,
            strokeShadowColor: pieceShadowColorPicker.value,
            strokeShadowBlur: pieceShadowBlurSlider.value,

            member: _member.GetName(),
            members: [],

            activeTool: _activeTool
        };
        // Serialize piece protoype based objects
        for (p of _pieces) {
            stateJSON.pieces.push(p.Serialize());
        }
        // Serialize members
        for (m of _members) {
            stateJSON.members.push(m.GetName());
        }

        return stateJSON;
    }

    this.RestoreStateJSON = function(stateJSON) {
        // _code = stateJSON.code;
        // _codeDisplay.textContent = _code;

        restoreMember(stateJSON);

        pieceColorPicker.value = stateJSON.strokeColor;
        pieceSizeSlider.value = stateJSON.strokeWidth;
        pieceShadowColorPicker.value = stateJSON.strokeShadowColor;
        pieceShadowBlurSlider.value = stateJSON.strokeShadowBlur;

        setActiveTool(stateJSON.activeTool);

        restoreCanvasStateJSON(stateJSON);
    }

    //
    // Init canvas
    //

    // Set active tool
    setActiveTool('draw');

    // Set initial canvas dimensions
    _canvas.height = _canvasHeightSlider.value;
    _canvas.width = _canvasWidthSlider.value;
    // Calculate initial scale factors and scale down mini map
    calcScaleFactors();
    _miniMapCtx.scale(_scaleWidthDownFactor, _scaleHeightDownFactor);

    // Restore state from session
    let state = window.sessionStorage.getItem('state');
    state = JSON.parse(state);
    if (state !== null) {
        this.RestoreStateJSON(state);
    } else {
        state = this.SaveStateJSON();
    }

    this.Refresh();
    reScaleMiniMap();

    //
    // Init socket
    //

    // Connect to socket
    // let _socket = new WebSocket('ws://localhost:8080/roomsmanager');
    let _socket = new WebSocket('wss://qolboard.herokuapp.com/roomsmanager');
    console.log('Attempting to connect to socket');

    // Listen for socket open
    _socket.onopen = () => {
        console.log('Successfully connected to socket')
        let state = _me.SaveStateJSON();
        let message = {desc: 'request-join-room', code: _code, canvas: state, member: _member.GetName()}
        _socket.send(JSON.stringify(message));
    }

    // Listen for socket close
    _socket.onclose = (e) => {
        console.log('Socket closed connection: ', e);
    }

    // Listen for socket errors
    _socket.onerror = (e) => {
        console.log('Socket error: ', e)
    }

    _socket.onmessage = (e) => {
        console.log('Message from socket: ', e.data);
        let message = JSON.parse(e.data);
        // Update code every time
        _code = message.code;
        _codeDisplay.textContent = _code;
        // Process message from socket
        switch(message.desc) {
            case 'create-room': {
                restoreFromServer(message);
                break;
            }
            case 'accepted-join': {
                _toggleNotifications.classList.remove('animation-new-notif');
                restoreFromServer(message);
                for (node of _joinNotifOutgoing.children) {
                    if (node.childNodes[1].textContent == _code) {
                        _joinNotifOutgoing.removeChild(node);
                        return;
                    }
                }
                break;
            }
            case 'cancel-join-room': {
                _toggleNotifications.classList.remove('animation-new-notif');
                _joinNotifIncoming.removeChild(_joinNotifIncoming.children[message.index]);
                break;
            }
            case 'someone-joined-room': {
                _toggleNotifications.classList.remove('animation-new-notif');
                _joinNotifIncoming.removeChild(_joinNotifIncoming.children[message.index]);
                _members.push(new Member(_membersContainer, _me, false, message.member));
                break;
            }
            case 'request-join-room': {
                _toggleNotifications.classList.add('animation-new-notif');
                // Container
                let container = document.createElement('container');
                _joinNotifIncoming.appendChild(container);
                container.className = 'notif';
                // Member name
                let member = document.createElement('span');
                container.appendChild(member)
                member.textContent = message.member;
                // Button container
                let buttonContainer = document.createElement('div');
                container.appendChild(buttonContainer);
                // Accept button
                let accept = document.createElement('button');
                buttonContainer.appendChild(accept);
                accept.className = 'button material-icons'
                accept.textContent = 'person_add'
                accept.addEventListener('click', function() {
                    _toggleNotifications.classList.remove('animation-new-notif');
                    let m = {desc: 'accepted-join', code: _code, index: message.index}
                    _socket.send(JSON.stringify(m));
                }, false);
                // Decline button
                let decline = document.createElement('button');
                buttonContainer.appendChild(decline);
                buttonContainer.className = 'notif';
                decline.className = 'button material-icons'
                decline.textContent = 'person_remove'
                decline.addEventListener('click', function() {
                    _toggleNotifications.classList.remove('animation-new-notif');
                    let message = {desc: 'declined-join', code: _code};
                    _socket.send(JSON.stringify(message));
                    _joinNotifIncoming.removeChild(container);
                }, false);
                break;
            }
            case 'member-disconnected': {
                refreshMembers(message);
                break;
            }
            case 'add-piece': {
                let p = Piece.prototype.deserialize(_me, _canvasContainer, _ctx, _miniMapCtx, message.piece);
                _pieces.push(p);
                p.Show();
                p.ShowMiniMap();
                break;
            }
            case 'remove-piece': {
                let i = message.index;
                _me.Remove(_pieces[i]);
                break;
            }
            case 'update-piece': {
                let i = message.index;
                _me.ClearPiece(_pieces[i].GetLowestX(), _pieces[i].GetLowestY(), _pieces[i].GetWidth(), _pieces[i].GetHeight(), _pieces[i]);
                _pieces[i] = Piece.prototype.deserialize(_me, _canvasContainer, _ctx, _miniMapCtx, message.piece);
                _me.RefreshSection(_pieces[i].GetLowestX(), _pieces[i].GetLowestY(), _pieces[i].GetWidth(), _pieces[i].GetHeight());
                break;
            }
            case 'repaint-canvas': {
                restoreFromServer(message);
                break;
            }
            case 'set-member-name': {
                refreshMembers(message);
                break;
            }
            default: {
                break;
            }
        }
    }
}
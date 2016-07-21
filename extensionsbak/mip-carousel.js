define(function(){
    var customElem = require('buildins/customElement');

    var build = function () {
        // 避免多次渲染
        if(this.isRender){
            return; 
        }
        this.isRender = true;

        var $this = $(this);

        var hei = $this.attr('height');
        var wid = $this.attr('width');

        if (!wid || !hei || typeof +hei !== 'number' || typeof +wid !== 'number') {
            return;
        }

        // padding-bottom
        var pdb = +hei / +wid * 100 + '%';
        $this.css('padding-bottom', pdb);

        // 如果子节点少于2个，则不需要轮播
        var $childs = $this.children();
        if ($childs.length < 2) {
            return;
        }

        // 当前展示的图片序号
        var currentIndex = 0;

        // 被隐藏的图片的left属性值
        var HIDE_LEFT = -9999;

        // 轮播动画时长
        var DURATION = 800;

        // 轮播思路：轮播只涉及2张图片，分别是当前图片和下一张要出现的图片，把下一张图片放到当前图片的前面或者后面，
        //         然后移动到当前图片的位置，其余不涉及的图片全部设置left:-9999px，具体可以看效果
        $childs.css({
            'position': 'absolute',
            'left': HIDE_LEFT,
            'top': 0,
        });
        $childs.eq(currentIndex).css('left', 0);

        // 如果mip-carousel里子节点是mip-img，并且mip-img弹出了浮层
        var isMipImgPop = false;

        // 当前是否处于轮播动画中
        var isAnimating = false;

        /**
         * 切换图片函数
         *
         * @param  {Boolean} forward 前进(true)或者后退(false)
         *
         * @return {Object}         Deferred/Promise对象
         */
        var switchItem = function (forward) {
            var index = forward ? (currentIndex + 1) : (currentIndex - 1);
            if (index < 0) {
                index = $childs.length - 1;
            }
            else if (index >= $childs.length) {
                index = 0;
            }
            // 图片占据的一屏宽度
            var perWid = $this.width();
            var left = (forward ? 1 : -1) * perWid;
            $childs.filter(function (i) {
                return (i !== currentIndex && i !== index);
            }).css('left', HIDE_LEFT);
            $childs.css({
                'display': 'block',
                'opacity': 1,
                'z-index': 1
            });
            $childs.eq(index).css({
                'left': left,
                'z-index': 2
            });
            var def = $.Deferred();
            isAnimating = true;
            $childs.eq(index).animate({
                left: 0
            }, DURATION, function () {
                currentIndex = index;
                isMipImgPop ? def.reject() : def.resolve();
                isAnimating = false;
            });
            $childs.eq(currentIndex).fadeOut(DURATION);
            return def.promise();
        };

        // 是否需要自动轮播
        var autoTimer;

        function autoPlay(time) {
            autoTimer = setTimeout(function () {
                switchItem(true).then(function () {
                    autoPlay(time);
                });
            }, time);
        }

        var defer;
        var isAutoPlay = false;
        if ($this.attr('autoplay') === 'autoplay' || $this.attr('autoplay') === '') {
            if (typeof +this.getAttribute('defer') === 'number') {
                defer = +this.getAttribute('defer');
            }
            else {
                defer = 2000;
            }
            isAutoPlay = true;
            autoPlay(defer);
        }

        var gesture = require('gesture');
        gesture.init();
        gesture.bind(function (evt, data) {
            if(navigator.control.gesture) {
                navigator.control.gesture(false);
            }
            // 用户手指滑动结束且手势为横向滑动且当前不处于动画播放状态
            if (data.event === 'touchend' && Math.abs(data.x) > Math.abs(data.y) && !isAnimating) {
                autoTimer && clearTimeout(autoTimer);
                // 向右滑（上一张）or 向左滑(下一张)
                var forward = !(data.x > 0);
                switchItem(forward).then(function () {
                    if (isAutoPlay) {
                        autoPlay(defer);
                    }
                });
            }
            return false;
        });

        if (isAutoPlay) {
            $this.delegate('mip-img', 'click', function () {
                if ($(this).attr('popup') === 'popup' || $(this).attr('popup') === '') {
                    autoTimer && clearTimeout(autoTimer);
                    isMipImgPop = true;
                }
            });

            $this.delegate('.mip-img-popUp-wrapper', 'click', function () {
                autoPlay(defer);
                isMipImgPop = false;
                return false;
            });
        }

    };

    customElem.prototype.init = function () {
        this.build = build;
    };

    return customElem;
});
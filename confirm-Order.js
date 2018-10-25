$(function () {
    var privilegePrice;
    var payment;
    payment = $('#mask_select_payment').find('li.actived').data("pay")
    //选择支付方式
    $('#mask_select_payment li').on('click', function (e) {
        var $this = $(this);
        var result = $this.data('name');
        $this.siblings().removeClass('actived');
        $this.addClass('actived');

        $this.siblings().find($(".mode-payment-right span")).removeClass("mode-payment-right-btn")
        $this.find($(".mode-payment-right span")).addClass("mode-payment-right-btn")

    });

    //获取收货地址列表
    function getAddressList() {
        function addressCB(data) {
            if (data.length < 1) return;
            $('.head-addr').html(data.province.name + data.city.name + data.district.name + data.detail);
            $('.user-number').html(data.mobile);
            $('.user-name').html(data.consignee);
            $(".head-cont").data("id", data.id);
        }
        requestUrl('/member/address/get-default-address', 'GET', '', addressCB)
    }
    getAddressList();

    //显示余额
    function getBalance() {
        function balanceCB(data) {
            $('.mode-payment-else-yue').html("￥" + data.rmb.toFixed(2))
        }
        requestUrl('/member/index/get-user-balance', 'GET', '', balanceCB)
    }
    getBalance();
    //加载可选地址
    function loadSelectAddress() {
        var _url = "/member/address/get-address-list";

        //加载地址列表
        function success(data) {
            var tpl_address = $('#J_tpl_address').html();
            var result = juicer(tpl_address, data);
            $(".J_address_list").html(result);


            //选择新地址
            $(".address-main").on("click", function () {
                $("#J-address-selected").removeClass("hidden")
            });

            $('.J_address_list').on('click', '.J_address_item', function () {
                $(".head-cont").data('id', $(this).data("id"));
                $(".user-name").html($(this).find(".J_contact").html());
                $(".user-number").html($(this).find(".J_mobile").html());
                $(".head-addr").html($(this).find(".J_address").html());
                $("#J-address-selected").addClass('hidden');
            });
        }
        requestUrl(_url, 'get', '', success);
    }


    var _tpl_coupon = $("#J_tpl_coupon").html();
    //加载优惠券

    var Coupon = {
        coupon: {},
        is_use: {},
        enable: {},
        renderData: {},
        reduction: 0,
        tpl: $("#J_tpl_coupon").html(),
        getCoupon: function () {
            var _this = this;
            requestUrl('/shopping/get-tickets', 'GET', {
                q: url('?q')
            }, function (data) {
                $.each(data.valid, function (i, val) {
                    _this.coupon[val.id] = val;
                })
                requestUrl('/shopping/get-suitable-tickets', 'GET', {
                    q: url('?q')
                }, function (data) {
                    _this.enable = data;
                    _this.judge_all();
                })
            })
        },
        judge_all: function () {
            var _this = this;
            // 遍历查询是否有可用优惠券
            $.each($('.J_coupon_box'), function (i, val) {
                var type = $(this).data('type').toString();
                var supplier = $(this).data('supplier');
                var _selected = $(this).find('.J_use_coupon').data('selected');
                if (_selected != undefined) {
                    return true
                }
                var _list = [];
                if (type === '0') {
                    $.each(_this.enable[supplier]['0'], function (i, val) {
                        if (!_this.is_use[val]) {
                            _list.push(val)
                        }
                    })
                    if (_this.reduction > 0) {
                        _list = [];
                    }
                } else {
                    var sku = $(this).data('sku').toString();
                    $.each(_this.enable[supplier]['1'][sku], function (i, val) {
                        if (!_this.is_use[val]) {
                            _list.push(val)
                        }
                    })
                }
                if (_list.length > 0) {
                    $(this).find('.J_use_coupon').data('enable', 'true').html('选择优惠券');
                } else {
                    $(this).find('.J_use_coupon').data('enable', 'false').html('暂无可用优惠券');
                }
            })
        },
        handle: function () {
            var _this = this;
            // 渲染可用优惠券
            $('#J_order_box').on('click', '.J_use_coupon', function () {
                var _enable = $(this).data('enable');
                if (!_enable) {
                    return
                }
                var type = $(this).parents('.J_coupon_box').data('type').toString();
                var supplier = $(this).parents('.J_coupon_box').data('supplier').toString();
                var _selected = $(this).data('selected');
                var _data = [];
                if (type === '0') {
                    var _list = _this.enable[supplier]['0'];
                    $.each(_list, function (i, val) {
                        if (!_this.is_use[val]) {
                            _data.push(_this.coupon[val])
                        }
                    })
                } else {
                    var sku = $(this).parents('.J_coupon_box').data('sku').toString();
                    var _list = _this.enable[supplier]['1'][sku];
                    $.each(_list, function (i, val) {
                        if (!_this.is_use[val]) {
                            _data.push(_this.coupon[val])
                        }
                    })
                }
                if (_selected != undefined) {
                    _data.push(_this.coupon[_selected])
                }
                $('.J_coupon_list').html(juicer(_this.tpl, _data));
                var _index = $(this).parents('.J_coupon_box').index();
                $("#J_coupon_select").removeClass('hidden').data('index', _index);
            })

            function judgePrice() {
                var _cprice = 0;
                $.each(_this.is_use, function (i, val) {
                    _cprice += parseFloat(_this.coupon[val].price)
                })
                $('#privilege').html("￥ " + parseFloat(_cprice + _this.reduction).toFixed(2));
                $("#vertical-reduction").html("￥ " + parseFloat(_cprice + _this.reduction).toFixed(2));
                $('.J_pay_price').html("￥ " + ($('.J_pay_price').data('price') - _cprice).toFixed(2));
            }
            // 关闭选择遮罩层同时取消使用优惠券
            $('#J_coupon_select').on('click', '.J_no_select_ticket', function () {
                var _index = $('#J_coupon_select').data('index');
                var _id = $('.J_coupon_box').eq(_index).find('.J_use_coupon').data('selected');
                delete _this.is_use[_id];
                $('.J_coupon_box').eq(_index).find('.J_use_coupon').data('selected', undefined);
                $("#J_coupon_select").addClass('hidden');
                _this.judge_all();
                judgePrice()
            })
            // 确定使用优惠券
            $('.J_coupon_list').on('click', '.J_use_coupon_btn', function () {
                var _index = $("#J_coupon_select").data('index');
                var _id = $('.J_coupon_box').eq(_index).find('.J_use_coupon').data('selected');
                delete _this.is_use[_id];
                var id = $(this).data('id');
                _this.is_use[id] = id;
                $('.J_coupon_box').eq(_index).find('.J_use_coupon').data('selected', id).html('满' + _this.coupon[id].limit_price + '减' + _this.coupon[id].price);
                $("#J_coupon_select").addClass('hidden');
                _this.judge_all();
                judgePrice()
            })
        },

        init: function () {
            this.getCoupon();
            this.handle();
            $(".sec-pic img").click(function(){
                var pro_id = $(this).data("id");
                window.location.href = "/goods/detail?id="+pro_id;
            })
            // 两文本超出显示...
            function fontsize(biaoqian) {
                var Size = parseInt($('.' + biaoqian).css('font-size'));
                var Width = parseInt($('.' + biaoqian).css('width'));
                var num = Width / Size * 2;
                // 单行字数
                var num1 = Width / Size;
                // 显示字数
                var num2 = Width / Size * 2 - 2;

                $('.' + biaoqian).each(function () {
                    if ($(this).text().length > num) {
                        $(this).html($(this).text().replace(/\s+/g, "").substr(0, num2) + "...")
                    }
                })
            }

            // 传入字符串
            fontsize('c-txt');
        }
    }

    function getReduction() {
        requestUrl('/shopping/get-reduction', 'GET', {
            q: url('?q')
        }, function (data) {
            Coupon.reduction = data.reduce_rmb;
            $('.J_coupon_money').html(data.reduce_rmb.toFixed(2));
            getOrder(); //加载订购选项
        })
    }
    getReduction()
    //加载地址
    loadSelectAddress();



    //获取订单信息
    function getOrder() {
        var data = {
            q: url('?q')
        };

        function orderCB(data) {
            var _count = 0,
                _price = 0,
                count = 0;
            $.each(data, function (i, val) {
                $.each(val.items, function (j, value) {
                    $.each(value, function (i, v) {
                        _count += v.count;
                        _price += v.count * v.price
                    })
                })
            })
            var pric = function (data) {
                return data.toFixed(2);
            }

            juicer.register('pric_build', pric);
            var tpl_order = $('#J_tpl_order').html();
            var result = juicer(tpl_order, data);
            $('#J_order_box').html(result);
            goodsPrice(_count)


            $.each($(".deliver-goods-reduce"),function(index,item){
                goodsNum($(item))
            })


            // // 加
            // $(".deliver-goods-add").click(function () {
            //     _price = 0;
            //     var _this = $(this);
            //     count = Number(_this.parent().find(".deliver-goods-text").val());
            //     count += 1;

            //     _this.parent().find(".deliver-goods-text").val(count)
            //     _count += 1;
                
            //     $.each($(".txt-box"),function(index,item){
            //         _price += Number($(item).children().find(".txt-money .price").text().substring(1)) * Number($(item).children().find(".button .deliver-goods-text").val())
            //     })
            //     _this.parent().find(".deliver-goods-reduce").css({
            //         display: 'inline-block',
            //         width: '60 * $baseV',
            //         height: '60 * $baseV',
            //         background: 'url(/images/group_goods_detail/reduce_active.png)  no-repeat',
            //         backgroundSize: 'contain'
            //     });
                
            //     goodsPrice(_count);
            // })
            // // 减
            // $(".deliver-goods-reduce").click(function () {
            //     _price = 0;
            //     var _this = $(this);
            //     count = Number(_this.parent().find(".deliver-goods-text").val());
            //     count -= 1;
            //     if(_this.parent().find(".deliver-goods-text").val() == 1) {
            //         count = 1;
            //     }
                
            //     _this.parent().find(".deliver-goods-text").val(count);
            //     goodsNum(_this);
            //     _count -= 1;
            //     $.each($(".txt-box"),function(index,item){
            //         _price += Number($(item).children().find(".txt-money .price").text().substring(1)) * Number($(item).children().find(".button .deliver-goods-text").val())
            //     })
            //     goodsPrice(_count);
                
            // })

            function goodsNum(_this) {
                if (_this.parent().find(".deliver-goods-text").val() == 1) {
                    _this.css({
                        display: 'inline-block',
                        width: '60 * $baseV',
                        height: '60 * $baseV',
                        background: 'url(/images/group_goods_detail/reduce_failure.png)  no-repeat',
                        backgroundSize: 'contain'
                    });
                } else {
                    _this.css({
                        display: 'inline-block',
                        width: '60 * $baseV',
                        height: '60 * $baseV',
                        background: 'url(/images/group_goods_detail/reduce_active.png)  no-repeat',
                        backgroundSize: 'contain'
                    });
                }
            }

            function goodsPrice(_count){
                $('#J_product_count').html(_count);
                var pric = function (data) {
                    return data.toFixed(2);
                }

                $('#goods-price').html("￥ " + _price.toFixed(2)).data('price', _price.toFixed(2));
                $('#money-total').html("￥ " + (_price - Coupon.reduction).toFixed(2)).data('price', (_price - Coupon.reduction).toFixed(2));
                $("#confirm-payment .price").html("￥ " + (_price - Coupon.reduction).toFixed(2)).data('price', (_price - Coupon.reduction).toFixed(2));
            }

            
            // 初始化优惠券
            Coupon.init()
        }

        function errorCB(data) {
            if (data.status == 3101) {
                window.location.href = "/shopping/index";
            } else {
                alert(data.data.errMsg);
            }
        }
        requestUrl('/shopping/get-order-item', 'GET', data, orderCB, errorCB)
    }


    // 创建订单
    $("#confirm-payment").off("click").on("click", function () {
        if ($(this).hasClass('disabled')) return false;
        var id = $('.head-cont').data('id');
        payment = $('#mask_select_payment').find('li[class*="actived"]').data('id')
        if (payment == undefined) {
            alert("请选择支付方式");
        } else {
            var _balance = parseFloat($('.mode-payment-else-yue').html().split("￥")[1]);
            var _price = parseFloat($('#money-total').text().split("￥")[1]);
            J_remark_input
            if (payment == 1) {
                if (_price > _balance) {
                    alert('余额不足！')
                    return
                }
            }
            if (id == undefined || id == 0) {
                alert('请选择收货地址')
                return
            }

            $(this).addClass('disabled');
            $(this).text('订单提交中...');
            var data = {
                q: url('?q'),
                address: id,
                payment: payment,
                items: {}
            }
            $.each($('.J_coupon_box'), function (i, val) {
                var supplier = $(val).data('supplier');
                data.items[supplier] = {};
                data.items[supplier]['0'] = {};
                data.items[supplier]['1'] = {};
            })
            $.each($('.J_coupon_box'), function (i, val) {
                var supplier = $(this).data('supplier');
                if ($(this).data('type').toString() === '0') {
                    var ticket_id = $(this).find('.J_use_coupon').data('selected');
                    if (ticket_id == undefined) {
                        data.items[supplier]['0']['ticket'] = '';
                    } else {
                        data.items[supplier]['0']['ticket'] = ticket_id;
                    }
                    $.each($(val).find('.sec-footer'), function (i, value) {
                        var _id = $(value).data('skuid').toString();
                        data.items[supplier]['0'][_id] = $(value).find('.J_mark').val();
                    })
                } else {
                    var _sku = $(val).data('sku');
                    var ticket_id = $(this).find('.J_use_coupon').data('selected');
                    if (ticket_id == undefined) {
                        ticket_id = ''
                    }
                    if (!data.items[supplier]['1'][_sku]) {
                        data.items[supplier]['1'][_sku] = [{
                            comment: $(val).find('.J_mark').val(),
                            ticket: ticket_id
                        }];
                    } else {
                        data.items[supplier]['1'][_sku].push({
                            comment: $(val).find('.J_mark').val(),
                            ticket: ticket_id
                        })
                    }
                }
            })
        }

        function submitCB(data) {
            if (data.url) {
                // window.location.href = data.url;
            } else {
                var yes = confirm(data.error);
                window.location.href = '/shopping/index';
                return;
            }
        }

        function errCB(data) {
            $('.J_create_order').removeClass('disabled');
            $('.J_create_order').text('提交订单');
            alert(data.data.errMsg);
        }
        requestUrl('/shopping/create-order', 'post', data, submitCB, errCB)
    });


    // 微信支付
    function wxzhifu(url){
        $.ajax({
            url: 'http://106.14.255.215/api/9daye',
            data: {
                m: 'm_js_sdk',
                url: window.location.href
            },
            success: function(data) {
                var data = data.data
                wx.config({
                    debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                    appId: data.appId, // 必填，公众号的唯一标识
                    timestamp: data.timestamp, // 必填，生成签名的时间戳
                    nonceStr: data.nonceStr, // 必填，生成签名的随机串
                    signature: data.signature,// 必填，签名，见附录1
                    jsApiList: ['checkJsApi','chooseWXPay']
                });
                wx.checkJsApi({
                    jsApiList: ['chooseWXPay'], // 需要检测的JS接口列表，所有JS接口列表见附录2,
                    success: function(res) {
                        console.log(res);
                    // 以键值对的形式返回，可用的api值true，不可用为false
                    // 如：{"checkResult":{"chooseWXPay":true},"errMsg":"checkJsApi:ok"}
                    }
                });
                wx.ready(function() {
                    wx.chooseWXPay({
                        timestamp: data.timestamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
                        nonceStr: data.nonceStr, // 支付签名随机串，不长于 32 位
                        package: url, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=\*\*\*）
                        signType: 'MD5', // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
                        paySign: data.signature, // 支付签名
                        success: function (res) {
                            console.log(res);
                        // 支付成功后的回调函数
                        }
                    });
                })
                
                
            },
            error: function(data) {
                alert(data)
            }
        })
    }


})

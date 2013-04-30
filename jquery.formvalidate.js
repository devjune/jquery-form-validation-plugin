/*!
 * jQuery form validation plugin
 * - jQuery 폼유효성 체크 플러그인
 *
 * @version : 0.2b
 * @requires : jQuery v1.2+
 * @github at : https://github.com/sjune/jquery-form-validation-plugin
 * @author : sjune (dev.sjune@gmail.com)
 * @since 2011.08.18
 *
 * Copyright (c) 2011 sjune (dev.sjune@gmail.com)
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

/**
 * jQuery form validate plugin.
 */
(function ($) {
    $.validate = {
        currentForm : null,
        config : {},
        init : function() {
            $.validate.config = {
                    allRequired : false,      // 유효성 검사 필드 전체 적용 여부
                    rules : {},                 // 유효성 검사 rule
                    label : {},                 // 필드의 레이블
                    customSubmit : null   // 직접 submit 할 경우 함수
                }
        },
        build : function(opts) {
            if(!$(this).is("form")) return false;

            $.validate.currentForm = $(this);
            $.validate.init();
            $.extend($.validate.config, opts);   // config에 options를 merge함.

            $.validate.currentForm.submit(function(){
                if($.validate.config.allRequired && !$.validate.validateForm()) return false;
                if(!$.validate.validateRequiedForm()) return false;
                if($.isFunction($.validate.config.customSubmit)) {
                    try {
                        $.validate.config.customSubmit();
                        return false;
                    } catch (e){alert(e);}
                }
                return true;
            });
        },

        /**
         * 특정 name을 가진 필드에 대해서 유효성 검증
         */
        validateRequiedForm : function() {
            var $frm = $.validate.currentForm;
            var rules = $.validate.config.rules;

            for(var elementName in rules) {
                var $el = $frm.find("[name='"+elementName+"']");
                if(!$el.size()) continue;

                // 유효성 검증!
                for(var validateType in rules[elementName]) {
                    try {
                        if(rules[elementName][validateType] ||
                                rules[elementName][validateType] > 0) {
                            var params = {
                                "element" : $el,
                                "validateType" : validateType
                            };

                            if(rules[elementName].minLength) {
                                $.extend(params, {"minLength" : rules[elementName].minLength});
                            }

                            if(rules[elementName].maxLength) {
                                $.extend(params, {"maxLength" : rules[elementName].maxLength});
                            }

                            if(!$.validate.checkValidateTag(params)) {
                                return false;
                            }
                        }
                    } catch(e) {
                        alert("validateRequiedForm() error ! : " + e);
                        return false;
                        break;
                    }
                } // end of for
            } // end of for

            return true;
        },

        /**
         * form 에 있는 모든 필드에 대해 유효성 검증
         * exception 목록에 포함된 필드는 유효성 검증에 제외시킴
         */
        validateForm : function() {
            var $frm = $.validate.currentForm;
            var exceptionList = $.validate.getExceptionList();
            var returnFlag = true;

            $frm.find("input,select,textarea").each(function(i, e){
                var $el = $(this);
                var _type = $el.attr("type");

                if($el.is(":hidden")) return true; // 만약 태그가 hidden 이거나 display:none 일 경우 skip
                if($.inArray($el.attr("name"), exceptionList) >= 0) return true; // 예외 목록에 속해있다면 skip

                if(_type == "checkbox" || _type == "radio") {
                    // checkbox나 radio같은 경우는 같은 이름으로 집합하여 검증
                    var elementName = $el.attr("name");
                    $el = $frm.find("[name='"+elementName+"']");
                }

                try {
                    var params = {
                        element : $el,
                        validateType : "required"
                    };

                    if(!$.validate.checkValidateTag(params)) {
                        returnFlag = false;
                        return false;
                    }
                } catch(e) {
                    alert("validateForm() error ! : " + e);
                    return false;
                }
            });

            return returnFlag;
        },

        /**
         * 유효성 검증 exception 리스트 얻기
         */
        getExceptionList : function() {
            var list = $.validate.config.exception;
            var returnList = [];
            for(var elementName in list) {
                if(elementName != "") returnList.push(elementName);
            }
            return returnList;
        },

        /**
         * 태그의 유효성 검증
         */
        checkValidateTag : function(params) {
            var $el = params.element;
            var validateType = params.validateType;
            var validateLength = (validateType == "minLength") ? params.minLength : params.maxLength;

            var _type = $el.attr("type");
            var _tagName = $.validate.config.label[$el.attr("name")] || $el.attr("name");

            var message;

            // input tag 검증
            switch(_type) {
                case "text" :
                case "file" :
                case "password" :
                    // <input type="text" name="name[]" /> 형식처럼 이름이 배열로 들어 오는 경우도 고려함
                    var returnFlag = true;
                    message = $.validate.getMessage("input", validateType, _tagName, validateLength);
                    $el.each(function(i , e){
                        if(!$.isValidValue[validateType].input($(this), validateLength)) {
                            alert(message);
                            $(this).focus();
                            returnFlag = false;
                            return false;
                        }
                    });
                    return returnFlag;
                    break;
                case "checkbox" :
                case "radio" :
                    message = $.validate.getMessage("check", validateType, _tagName, validateLength);
                    if(!$.isValidValue[validateType].check($el)) {
                        alert(message);
                        $el.first().focus();
                        return false;
                    }
                    break;
                default :
                    break;
            } // end switch

            // input 이 아닌 tag 검증
            var _tag = $el.get(0).tagName;

            switch(_tag){
                case "TEXTAREA" :
                    message = $.validate.getMessage("input", validateType, _tagName, validateLength);
                    if(!$.isValidValue[validateType].input($el, validateLength)) {
                        alert(message);
                        $el.focus();
                        return false;
                    }
                    break;
                case "SELECT" :
                    message = $.validate.getMessage("select", validateType, _tagName, validateLength);
                    if(!$.isValidValue[validateType].select($el)) {
                        alert(message);
                        $el.focus();
                        return false;
                    }
                    break;
            } // end of switch
            return true;
        },

        /**
         * 경고 메시지 얻기
         * @param tagType (input|select|check)
         * @param validateType (required|number|email|minLength|maxLength)
         * @param tagName 대상이름
         * @param validateLength 체크할 값의 길이
         */
        getMessage : function(tagType, validateType, tagName, validateLength) {
            var message = $.messages[validateType];

            switch(tagType) {
                case "input" :
                    message = message.input
                        .replace("%s", tagName)
                        .replace("%d", validateLength);
                break;
                case "select" :
                    message = message.select
                        .replace("%s", tagName)
                        .replace("%d", validateLength);
                break;
                case "check" :
                    message = message.check
                        .replace("%s", tagName)
                        .replace("%d", validateLength);
                break;
            } // end of switch
            return message;
        },

        /**
         * 플러그인 destroy.
         */
        destroy : function() {
            $.validate.init();
            $.validate.currentForm.off();
        }
    };

    /**
     * 경고창 메시지 정의
     *  @validateType
     *      required(필수입력), number(숫자만), email(이메일주소),
     *      minLength(최소길이값), maxLength(최대길이값)
     */
    $.messages = {
        required : {
            input : "%s 입력해주세요.",
            select : "%s 선택해주세요.",
            check : "%s 선택해주세요."
        },
        number : {
            input : "%s 숫자만 입력해주세요."
        },
        email : {
            input : "%s 이메일 형식으로 입력해주세요. (예: master@email.com) "
        },
        minLength : {
            input : "%s %d자 이상 입력해주세요."
        },
        maxLength : {
            input : "%s %d자 이하로 입력해주세요."
        }
    };

    /**
     * 입력값 검증
     *  @validateType
     *      required(필수입력), number(숫자만), email(이메일주소),
     *      minLength(최소길이값), maxLength(최대길이값)
     */
    $.isValidValue = {
        required : {
            input : function($el) {
                return ($.trim($el.val()) != "");
            },
            select : function($el) {
                return ($el.val());
            },
            check : function($el) {
                return ($el.filter(":checked").length > 0);
            }
        },
        number : {
            input : function($el) {
                return ($el.val() && !isNaN($el.val()));
            }
        },
        email : {
            input : function($el) {
                var regx = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
                return ($el.val() && regx.test($el.val()));
            }
        },
        minLength : {
            input : function($el, size) {
                return ($el.val().length >= size);
            }
        },
        maxLength : {
            input : function($el, size) {
                return ($el.val().length <= size);
            }
        }
    };

    $.fn.extend({
        formValidate : $.validate.build,
        destroyFormValidate : $.validate.destroy
    });
})(jQuery);
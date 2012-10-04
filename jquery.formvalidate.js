/**
 * jQuery Alert Form Plugin
 * 
 * @version :  0.1b
 * @requires : jQuery v1.3 or later
 * @github at : https://github.com/sjune/jquery-alert-form-validator
 * @author : sjune (dev.sjune@gmail.com)
 * 
 * Copyright (c) 2011 sjune (dev.sjune@gmail.com)
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * ###################### 임시 매뉴얼 - 추후 도큐먼트로 뺄 계획 #######################
 *  - Form 유효성 check jQuery 플러그인
 *  - 사용법 : document ready 시에 유효성 처리가 필요한 form에 formValidate bind 시킨다.
 *    ex)
 *       // 1. 태그 각각에 대해서 규칙을 설정할 경우 
 *       var options = {
 *            // tag의 이름과 경고창에 보여질 레이블 이름을 정의 
 *            label : {
 *                "bordTitle" : "제목을"   //  -> '제목을 입력해주세요'
 *                "email": : "이메일을" // -> '이메일을 입력해주세요'
 *            },
 *            // 규칙 정의. rule를 반드시 정의 되어야 태그에 대해 유효성 검증을 한다.
 *            // require : 빈값 체크 
 *            // email : 이메일 필수입력
 *            // number : 숫자만 허용
 *            // minLength : 최소 길이
 *            // maxLength : 최대 길이  
 *            rules : {
 *                "bordTitle" : {
 *                    "required" : true,
 *                    "maxLength" 50
 *                },
 *                "emailAddress" : {
 *                    "email" : true
 *                }
 *            }
 *        };
 *        $("#write_form").formValidate(options);       
 *        
 *        // 2. form 에 존재하는 모든 태그에 규칙을 설정할 경우 
 *       var options = {
 *            // allRequired 속성을 사용하면 form에 존재하는 모든 태그에 규칙을 적용한다.
 *            allRequired : true,
 *            // 예외적으로 검증을 하지 않아야 할 태그가 있다면 exception 요소를 이용한다.
 *            exception : {
 *                "emailAddress" : {
 *                    "email" : required
 *                },
 *                "homepage" : {
 *                    "required" : false // 필수입력 제외   
 *                }
 *            }
 *        };
 *        $("#write_form").formValidate(options);
 *        
 *        // 3. 유효성 검증을 하고난 후 
 *        // 특별히 추가적으로 해야할 작업이 필요하다면  
 *        // customSubmit 속성을 이용하여 자동 submit을 멈출 수 있다.
 *       var options = {
 *            allRequired : true,
 *            customSubmit : function() {
 *                Editor.save();  // formValidate 플러그인의 submit을 이용하지 않고 Editor의 save 함수를 이용하여 저장
 *            }
 *        };
 *        $("#write_form").formValidate(options);        
 *         
 * @since 2011.08.18
 * @version 0.3
 * @author dev.sjune@gmail.com
 * @last_modified
 */

(function ($) {
    $.validate = {
        currentForm : null,
        config : {
            allRequired : false,        /* 유효성 검사 필드 전체 적용 여부 */
            rules : {},                 /* 유효성 검사 rule */
            label : {},                 /* 필드의 레이블 */
            customSubmit : null         /* 직접 submit 할 경우 함수 */
        },
        build : function(options) {
            if(!$(this).is("form")) return false;
            
            $.validate.currentForm = $(this);
            $.extend($.validate.config, options);    // merge config and options..

            $.validate.currentForm.submit(function(){
                if($.validate.config.allRequired && !$.validate.checkForm()) return false;
                if(!$.validate.checkRequiedForm()) return false;
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
        checkRequiedForm : function() {
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
                        alert("checkRequiedForm() error ! : " + e);
                        return false;
                        break;
                    }
                } // end for
            } // end for      

            return true;
        },        
        
        /**
         * form 에 있는 모든 필드에 대해 유효성 검증 
         * exception 목록에 포함된 필드는 유효성 검증에 제외시킴
         */
        checkForm : function() {
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
                    alert("checkForm() error ! : " + e);
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
                    // <input type="text" name="name[]" /> 형식처럼 이름이 배열로 들어 오는 경우도 고려
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
            } // end switch
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
            }
            return message;
        }
    };
    
    /**
     * 경고창 메시지 정의 
     * validateType : required(필수입력), number(숫자만), email(이메일주소)
     *                minLength(최소길이값), maxLength(최대길이값) 
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
     * 값 검증
     * validateType : required(필수입력), number(숫자만), email(이메일주소)
     *                minLength(최소길이값), maxLength(최대길이값)
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
                var rege = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
                return ($el.val() && rege.test($el.val()));
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
        formValidate : $.validate.build
    });
})(jQuery);


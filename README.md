# jQuery Form Validation plugin.
폼 유효성 검증 실패시 브라우저 경고창을 통해 에러 메시지를 알려주는 jQuery 플러그인입니다.
> 라이센스: <a href="http://www.opensource.org/licenses/mit-license.php" target="_blank">_MIT_</a>

> jQuery 버전 요구사항: _jQuery 1.3+_


# 사용법

jquery core와 plugin script를 로드합니다.
```javascript
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script src="jquery.formvalidate.js"></script>
```

플러그인은 아래와 같이 호출합니다. selector는 유효성 검증을 할 폼으로 지정합니다.
```javascript
var options = { allRequired : true /*그 외 옵션 명시*/};
jQuery('form').formValidate(options);
```

html 폼 태그에는 별다른 수정이 없습니다. 다만 name 속성은 반드시 포함되어야 합니다.

```html
<form>
    <input type="text" name="username" />
    <input type="password" name="password" />
    <input type="text" name="emailAddress" />
</form>
```
더 자세한 사용법은 <a href="https://github.com/sjune/jquery-form-validation-plugin/tree/master/demo" target="_blank"> 데모</a>를 참조하시길 바랍니다. :)

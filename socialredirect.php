<?php
// Этот скрипт обманывает Android Instagram WebView
// Возвращая Content-type: application/pdf, WebView автоматически открывает во внешнем браузере

$userAgent = $_SERVER['HTTP_USER_AGENT'];
$redirectURL = isset($_GET['redirect']) ? urldecode($_GET['redirect']) : '';

// Проверяем что это Instagram Android
if (strpos($userAgent, 'Instagram') !== false && strpos($userAgent, 'Android') !== false) {
    // Trick: возвращаем PDF content-type
    // WebView не может открыть PDF внутри и открывает во внешнем браузере
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename=redirect.pdf');
    header('Content-Transfer-Encoding: binary');
    header('Accept-Ranges: bytes');
    
    // Выводим минимальный PDF content с редиректом
    echo '%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
/OpenAction 3 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [4 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Action
/S /URI
/URI (' . $redirectURL . ')
>>
endobj

4 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000067 00000 n
0000000125 00000 n
0000000193 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
271
%%EOF';
    exit;
} else {
    // Не Instagram Android — просто редирект
    if (!empty($redirectURL)) {
        header('Location: ' . $redirectURL);
        exit;
    } else {
        echo 'Invalid redirect URL';
        exit;
    }
}
?>

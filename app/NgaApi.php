<?php

namespace App;

class NgaApi
{
    private const APP_ID = "1010";
    private const SECRET = "392e916a6d1d8b7523e2701470000c30bc2165a1";
    private const BASE_URL = "https://ngabbs.com/app_api.php";

    private $uid;
    private $token;

    public function __construct($uid = "", $token = "")
    {
        $this->uid = $uid;
        $this->token = $token;
    }

    private function makeSign($signParams, $t)
    {
        $raw = self::APP_ID . $this->uid . $this->token . $signParams . $t . self::SECRET;
        return md5($raw);
    }

    public function fetchSubjectList($fid, $page = 1, $act = 'list', $orderBy = 'postdatedesc')
    {
        $t = time();
        $signParams = (string)$fid;
        $sign = $this->makeSign($signParams, $t);

        // Base payload common to all acts
        $payload = [
            'page' => (int)$page,
            '__output' => 14,
            '__inchst' => 'utf-8',
            'app_id' => self::APP_ID,
            'access_uid' => $this->uid,
            'access_token' => $this->token,
            't' => $t,
            'sign' => $sign,
        ];

        // Different acts use different parameter names for fid
        if ($act === 'topped') {
            // Topped uses 'topped' parameter instead of 'fid'
            $payload['topped'] = (string)$fid;
        } else {
            // List and hot use 'fid' parameter
            $payload['fid'] = (string)$fid;
            if ($act === 'list') {
                $payload['order_by'] = $orderBy;
            }
        }

        $url = self::BASE_URL . "?__lib=subject&__act=" . $act;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded',
            'Referer: https://ngabbs.com/',
            'User-Agent: Mozilla/5.0 (Linux; Android 10.0; POCOPHONE F1 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.7390.97 Mobile Safari/537.36',
            'X-USER-AGENT: Nga_Official/90954(Xiaomi POCOPHONE F1;Android 10.0)',
        ]);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return ['error' => $error];
        }

        $data = json_decode($response, true);
        return $data !== null ? $data : ['error' => 'Invalid JSON response'];
    }
}

<?php 
namespace App\Controllers;

class JWT {
    private $secretKey = '18b0cb61e4074cd306cb1c35143a5d570e650b6c047f
    a89947ec69b2dff219a53072f023b9bdaea240e1d1444ea88adde053d0e768f009
    3c9433b17eb253f5c2214e6b62e9cd8140d25c4847a9ad1c851abe44539c16ccf1
    d18c2be405a66c16c0990478eee290c6ff3b6efd16bf6723988740627ee02ea2b3
    cc7aedd9b502a8';  // 128 symbols key
    private $algorithm = 'HS256'; // Default algorithm
    private $expirationTime = 120; // Token expiration time in seconds
    public function encode($id){
        $header = json_encode(['typ' => 'JWT', 'alg' => $this->algorithm]);
        $payload = json_encode(['id' => $id, 'exp' => time() + $this->expirationTime]);
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        $signature = hash_hmac('sha256', "$base64UrlHeader.$base64UrlPayload", $this->secretKey, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        return "$base64UrlHeader.$base64UrlPayload.$base64UrlSignature";
    }

    // false - invalid token
    // id - valid token
    // [id , 'expired'] - expired token
    public function decode($jwt){
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return null;
        }
        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;
        $header = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlHeader)), true);
        if ($header['alg'] !== $this->algorithm) {
            return null;
        }
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlPayload)), true);
        $expired = false;
        if ($payload['exp'] < time()) {
            $expired = true;
        }
        $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlSignature));
        $expectedSignature = hash_hmac('sha256', "$base64UrlHeader.$base64UrlPayload", $this->secretKey, true);
        if ($signature !== $expectedSignature) {
            return null;
        }
        return ['id' => $payload['id'], 'expired' => $expired];
    }
}
?>
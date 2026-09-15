// GameManager.cs - Exemplo para Unity Ara Park
// Coloque este script em um GameObject vazio na cena principal

using UnityEngine;
using System;
using System.Collections;

[System.Serializable]
public class WorldConfig {
    public int worldWidth;
    public int worldHeight;
    public float voiceRange;
}

[System.Serializable]
public class PlayerData {
    public string id;
    public string name;
    public float x;
    public float y;
    public string direction;
    public bool speaking;
}

public class GameManager : MonoBehaviour {
    public static GameManager Instance { get; private set; }
    
    [Header("References")]
    public Transform playerTransform;
    public Camera mainCamera;
    
    [Header("Settings")]
    public float moveSpeed = 4f;
    public float voiceRange = 180f;
    
    private WorldConfig config;
    private string playerDirection = "down";
    private bool isMoving = false;
    
    void Awake() {
        if (Instance == null) {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        } else {
            Destroy(gameObject);
        }
    }
    
    void Start() {
        // Notifica React que Unity está pronto
        StartCoroutine(NotifyReady());
    }
    
    IEnumerator NotifyReady() {
        yield return new WaitForSeconds(0.5f);
        SendToReact("UNITY_LOADED", null);
    }
    
    void Update() {
        HandleInput();
        
        if (isMoving) {
            SendPlayerPosition();
        }
    }
    
    void HandleInput() {
        float horizontal = 0f;
        float vertical = 0f;
        
        // Keyboard input
        if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow)) {
            vertical = 1f;
            playerDirection = "up";
        }
        if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow)) {
            vertical = -1f;
            playerDirection = "down";
        }
        if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) {
            horizontal = -1f;
            playerDirection = "left";
        }
        if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) {
            horizontal = 1f;
            playerDirection = "right";
        }
        
        isMoving = horizontal != 0 || vertical != 0;
        
        if (isMoving && playerTransform != null) {
            Vector3 movement = new Vector3(horizontal, vertical, 0).normalized;
            playerTransform.position += movement * moveSpeed * Time.deltaTime;
            
            // Clamp to world bounds
            if (config != null) {
                playerTransform.position = new Vector3(
                    Mathf.Clamp(playerTransform.position.x, 0, config.worldWidth),
                    Mathf.Clamp(playerTransform.position.y, 0, config.worldHeight),
                    playerTransform.position.z
                );
            }
        }
    }
    
    void SendPlayerPosition() {
        if (playerTransform == null) return;
        
        var data = new {
            x = playerTransform.position.x,
            y = playerTransform.position.y,
            direction = playerDirection
        };
        SendToReact("PLAYER_POSITION", data);
    }
    
    // === Métodos chamados do React ===
    
    public void Initialize(string configJson) {
        config = JsonUtility.FromJson<WorldConfig>(configJson);
        Debug.Log($"[GameManager] World initialized: {config.worldWidth}x{config.worldHeight}");
    }
    
    public void SetPlayerPosition(string position) {
        if (playerTransform == null) return;
        
        var parts = position.Split(',');
        if (parts.Length == 2) {
            float x = float.Parse(parts[0]);
            float y = float.Parse(parts[1]);
            playerTransform.position = new Vector3(x, y, playerTransform.position.z);
        }
    }
    
    public void SetPlayerDirection(string direction) {
        playerDirection = direction;
    }
    
    public void PlayEmote(string emoteName) {
        Debug.Log($"[GameManager] Playing emote: {emoteName}");
        // Implementar animação de emote
    }
    
    public void SpawnRemotePlayer(string playerJson) {
        var player = JsonUtility.FromJson<PlayerData>(playerJson);
        Debug.Log($"[GameManager] Spawning remote player: {player.name} at ({player.x}, {player.y})");
        // Implementar spawn de player remoto
    }
    
    public void RemoveRemotePlayer(string playerId) {
        Debug.Log($"[GameManager] Removing player: {playerId}");
        // Implementar remoção de player
    }
    
    // === Comunicação com React ===
    
    void SendToReact(string type, object data) {
        #if UNITY_WEBGL && !UNITY_EDITOR
        string json = JsonUtility.ToJson(new MessageWrapper {
            type = "UNITY_MESSAGE",
            payload = new MessagePayload {
                type = type,
                data = data
            }
        });
        
        Application.ExternalEval($"window.postMessage({json}, '*')");
        #else
        Debug.Log($"[React Message] {type}: {JsonUtility.ToJson(data)}");
        #endif
    }
    
    [System.Serializable]
    class MessageWrapper {
        public string type;
        public MessagePayload payload;
    }
    
    [System.Serializable]
    class MessagePayload {
        public string type;
        public object data;
    }
}

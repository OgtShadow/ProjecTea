package app.model;

import jakarta.persistence.*;

@Entity
@Table(name = "\"Users\"")
public class Users {

    /**
     * User-s unique id
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_user")
    private Long idUser;

    /**
     * User-s unique nickname
     */
    @Column(name = "username", length = 128, nullable = false, unique = true)
    private String username;

    /**
     * User-s email to contact
     */
    @Column(name = "email", length = 256, nullable = false, unique = true)
    private String email;

    /**
     * Unique password of a user
     */
    @Column(name = "password", length = 128, nullable = false)
    private String password;

    /**
     * User-s first name
     */
    @Column(name = "name", length = 256)
    private String name;

    /**
     * User-s surname
     */
    @Column(name = "surname", length = 256)
    private String surname;

    /**
     * User-s role like admin, leader, member
     */
    @Column(name = "role", length = 128)
    private String role;

    // Getters and Setters:
    public Long getIdUser() { return idUser; }
    public void setIdUser(Long idUser) { this.idUser = idUser; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSurname() { return surname; }
    public void setSurname(String surname) { this.surname = surname; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
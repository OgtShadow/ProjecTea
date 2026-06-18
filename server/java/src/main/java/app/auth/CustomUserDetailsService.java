package app.auth;

import app.model.Users;
import app.repository.UsersRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsersRepository usersRepository;

    public CustomUserDetailsService(UsersRepository usersRepository) {
        this.usersRepository = usersRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("============== DEBUG LOGOWANIA ==============");
        System.out.println("1. Próba znalezienia w bazie usera: [" + username + "]");
        
        Users user = usersRepository.findByUsername(username)
                .orElseThrow(() -> {
                    System.out.println("2. BŁĄD: Nie znaleziono użytkownika w Oracle!");
                    return new UsernameNotFoundException("Nie znaleziono użytkownika: " + username);
                });

        System.out.println("2. SUKCES: Znaleziono użytkownika!");
        System.out.println("3. Hasło pobrane z bazy to: [" + user.getPassword() + "]");
        System.out.println("=============================================");

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole()) 
                .build();
    }
}
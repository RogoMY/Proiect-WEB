import java.sql.*;
import java.util.List;
import com.google.gson.reflect.TypeToken;
import com.google.gson.Gson;
import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.Type;

public class Main {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/web";
        String username = "root";
        String password = "parola";

        try {
            Connection connection = DriverManager.getConnection(url, username, password);
            List<Link> links = getLinksFromJson();

            for (Link link : links) {
                String insertLink = "INSERT INTO Links (href, description, title) VALUES (?, ?, ?)";
                PreparedStatement statement = connection.prepareStatement(insertLink, Statement.RETURN_GENERATED_KEYS);
                statement.setString(1, link.href);
                statement.setString(2, link.description);
                statement.setString(3, link.title);
                statement.executeUpdate();

                ResultSet generatedKeys = statement.getGeneratedKeys();
                if (generatedKeys.next()) {
                    int linkId = generatedKeys.getInt(1);

                    for (String scope : link.scopes) {
                        String insertScope = "INSERT INTO Scopes (scope) VALUES (?) ON DUPLICATE KEY UPDATE scope=scope";
                        statement = connection.prepareStatement(insertScope, Statement.RETURN_GENERATED_KEYS);
                        statement.setString(1, scope);
                        statement.executeUpdate();

                        generatedKeys = statement.getGeneratedKeys();
                        int scopeId;
                        if (generatedKeys.next()) {
                            scopeId = generatedKeys.getInt(1);
                        } else {
                            scopeId = getScopeId(connection, scope);
                        }
                        insertLinkScope(connection, linkId, scopeId);
                    }

                    if (link.programming_languages != null) {
                        for (String programmingLanguage : link.programming_languages) {
                            String insertProgrammingLanguage = "INSERT INTO prog_lang (lang) VALUES (?) ON DUPLICATE KEY UPDATE lang=lang";
                            statement = connection.prepareStatement(insertProgrammingLanguage, Statement.RETURN_GENERATED_KEYS);
                            statement.setString(1, programmingLanguage);
                            statement.executeUpdate();

                            generatedKeys = statement.getGeneratedKeys();
                            int programmingLanguageId;
                            if (generatedKeys.next()) {
                                programmingLanguageId = generatedKeys.getInt(1);
                            } else {
                                programmingLanguageId = getProgrammingLanguageId(connection, programmingLanguage);
                            }
                            insertLinkProgrammingLanguage(connection, linkId, programmingLanguageId);
                        }
                    }

                    if (link.filters != null) {
                        for (String filter : link.filters) {
                            String defaultCategory = "default_category";
                            String insertFilter = "INSERT INTO Filters (filter, category) VALUES (?, ?) ON DUPLICATE KEY UPDATE filter=filter, category=category";
                            statement = connection.prepareStatement(insertFilter, Statement.RETURN_GENERATED_KEYS);
                            statement.setString(1, filter);
                            statement.setString(2, defaultCategory);
                            statement.executeUpdate();

                            generatedKeys = statement.getGeneratedKeys();
                            int filterId;
                            if (generatedKeys.next()) {
                                filterId = generatedKeys.getInt(1);
                            } else {
                                filterId = getFilterId(connection, filter, defaultCategory);
                            }
                            insertLinkFilter(connection, linkId, filterId);
                        }
                    }
                }
            }
            connection.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    static List<Link> getLinksFromJson() {
        Gson gson = new Gson();
        Type listType = new TypeToken<List<Link>>() {}.getType();

        try (FileReader reader = new FileReader("links.json")) {
            return gson.fromJson(reader, listType);
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    static class Link {
        String href;
        String description;
        String title;
        List<String> scopes;
        List<String> programming_languages;
        List<String> filters;

        public Link(String href, String description, String title, List<String> scopes, List<String> programming_languages, List<String> filters) {
            this.href = href;
            this.description = description;
            this.title = title;
            this.scopes = scopes;
            this.programming_languages = programming_languages;
            this.filters = filters;
        }
    }

    static void insertLinkScope(Connection connection, int linkId, int scopeId) throws SQLException {
        String insertLinkScope = "INSERT INTO Link_Scopes (link_id, scope_id) VALUES (?, ?)";
        PreparedStatement statement = connection.prepareStatement(insertLinkScope);
        statement.setInt(1, linkId);
        statement.setInt(2, scopeId);
        statement.executeUpdate();
    }

    static void insertLinkProgrammingLanguage(Connection connection, int linkId, int programmingLanguageId) throws SQLException {
        String insertLinkProgrammingLanguage = "INSERT INTO Link_prog_lang (link_id, prog_lang_id) VALUES (?, ?)";
        PreparedStatement statement = connection.prepareStatement(insertLinkProgrammingLanguage);
        statement.setInt(1, linkId);
        statement.setInt(2, programmingLanguageId);
        statement.executeUpdate();
    }

    static void insertLinkFilter(Connection connection, int linkId, int filterId) throws SQLException {
        String insertLinkFilter = "INSERT INTO Link_Filter (link_id, filter_id) VALUES (?, ?)";
        PreparedStatement statement = connection.prepareStatement(insertLinkFilter);
        statement.setInt(1, linkId);
        statement.setInt(2, filterId);
        statement.executeUpdate();
    }

    static int getScopeId(Connection connection, String scope) throws SQLException {
        String query = "SELECT id FROM Scopes WHERE scope = ?";
        PreparedStatement statement = connection.prepareStatement(query);
        statement.setString(1, scope);
        ResultSet resultSet = statement.executeQuery();
        if (resultSet.next()) {
            return resultSet.getInt("id");
        } else {
            throw new SQLException("Scope not found: " + scope);
        }
    }

    static int getProgrammingLanguageId(Connection connection, String programmingLanguage) throws SQLException {
        String query = "SELECT id FROM prog_lang WHERE lang = ?";
        PreparedStatement statement = connection.prepareStatement(query);
        statement.setString(1, programmingLanguage);
        ResultSet resultSet = statement.executeQuery();
        if (resultSet.next()) {
            return resultSet.getInt("id");
        } else {
            throw new SQLException("Programming language not found: " + programmingLanguage);
        }
    }

    static int getFilterId(Connection connection, String filter, String category) throws SQLException {
        String query = "SELECT id FROM Filters WHERE filter = ? AND category = ?";
        PreparedStatement statement = connection.prepareStatement(query);
        statement.setString(1, filter);
        statement.setString(2, category);
        ResultSet resultSet = statement.executeQuery();
        if (resultSet.next()) {
            return resultSet.getInt("id");
        } else {
            throw new SQLException("Filter not found: " + filter + " in category: " + category);
        }
    }
}
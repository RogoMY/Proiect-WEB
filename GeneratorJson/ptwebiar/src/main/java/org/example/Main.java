import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;
public class Main {

    static String[] keywords = {
            "game", "graphics", "animation", "arduino", "web", "canvas", "3d", "2d", "algebra", "audio",
            "visual", "mac", "win", "math", "coding", "generative", "generation", "shader", "physics",
            "particle", "vector", "projects", "shepherding", "design", "code", "explain", "processing",
            "geometry", "ray", "artist", "music", "interactive", "framework", "linux", "cross-platform"
    };

    static String[] programmingLanguages = {
            "javascript", "python", "c++", "ruby", "php", "c#", "swift", "kotlin", "rust", "typescript",
            "html", "css", "js", "pearl", "haskell"
    };



    public static void main(String[] args) {
        String filePath = "info.txt";
        List<JSONObject> booksList = new ArrayList<>();
        String currentScope = "";

        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = br.readLine()) != null) {
                line = line.trim();
                if (line.startsWith("##")) {
                    currentScope = line.replace("#", "").trim(); // This line is changed
                // This line is changed
                } else if (line.startsWith("- [")) {
                    JSONObject book = processLine(line, currentScope);
                    if (book != null) {
                        booksList.add(book);
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        JSONArray jsonArray = new JSONArray(booksList);

        // Write JSON data to a file
        try (PrintWriter out = new PrintWriter(new FileWriter("links.json"))) {
            out.print(jsonArray.toString(4));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static JSONObject processLine(String line, String currentScope) {
        JSONObject book = new JSONObject();

        // Extract title
        int titleStart = line.indexOf('[') + 1;
        int titleEnd = line.indexOf(']');
        String title = line.substring(titleStart, titleEnd);

        // Extract href
        int hrefStart = line.indexOf('(') + 1;
        int hrefEnd = line.indexOf(')');
        String href = line.substring(hrefStart, hrefEnd);

        // Extract description
        int descriptionStart = line.indexOf(" - ") + 3;
        String description = line.substring(descriptionStart);

        book.put("title", title);
        book.put("href", href);
        book.put("description", description);

        // Determine scopes
        Set<String> scopes = new HashSet<>();
        scopes.add(currentScope.toLowerCase());
        for (String keyword : keywords) {
            if (description.toLowerCase().contains(keyword.toLowerCase())) {
                scopes.add(keyword);
            }
        }

        // Determine programming languages
        Set<String> languages = new HashSet<>();
        for (String language : programmingLanguages) {
            if (description.toLowerCase().contains(language.toLowerCase())) {
                languages.add(language);
            }
        }

        // Determine filters
        Set<String> filterSet = new HashSet<>();
        Map<String, List<String>> filters = new HashMap<>();
        filters.put("Tools", Arrays.asList("Frameworks", "Visual Programming Languages", "Sound Programming Languages", "Web Programming", "Projection Mapping", "Online", "Hardware", "Other Tools"));
        filters.put("Learning Resources", Arrays.asList("Videos", "Talks", "Shaders", "Canvas", "Hardware Articles", "Other Articles", "Interactive", "Quick References"));
        filters.put("Communities", Arrays.asList("Subreddits", "Slack", "Other Communities"));
        filters.put("Other", Arrays.asList("Books", "Online Books", "Courses", "Math", "Machine learning", "Inspiration", "Events", "Schools", "Blogs", "Related"));

        for (Map.Entry<String, List<String>> entry : filters.entrySet()) {
            for (String filter : entry.getValue()) {
                if (description.toLowerCase().contains(filter.toLowerCase())) {
                    filterSet.add(entry.getKey());
                    break;
                }
            }
        }

        book.put("scopes", new JSONArray(scopes));
        book.put("programming_languages", new JSONArray(languages));
        book.put("filters", new JSONArray(filterSet)); // This line is added

        return book;
    }
}

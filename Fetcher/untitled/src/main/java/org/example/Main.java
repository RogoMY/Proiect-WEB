import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import com.google.gson.Gson;
import java.io.FileWriter;
import java.io.IOException;
import java.util.stream.Collectors;
import java.util.*;

public class Main {
    public static void main(String[] args) {
        try {
            Document doc = Jsoup.connect("https://github.com/terkelg/awesome-creative-coding?tab=readme-ov-file").get();
            Elements listItems = doc.select("li");
            List<Link> links = new ArrayList<>();
            String[] programmingLanguages = {"javascript", "python", "c++", "ruby", "php", "c#", "swift", "kotlin", "rust", "typescript","html","css","js","pearl","haskell"};

            Map<String, List<String>> filters = new HashMap<>();
            filters.put("Tools", Arrays.asList("Frameworks", "Visual Programming Languages", "Sound Programming Languages", "Web Programming", "Projection Mapping", "Online", "Hardware", "Other Tools"));
            filters.put("Learning Resources", Arrays.asList("Videos", "Talks", "Shaders", "Canvas", "Hardware Articles", "Other Articles", "Interactive", "Quick References"));
            filters.put("Communities", Arrays.asList("Subreddits", "Slack", "Other Communities"));
            filters.put("Other", Arrays.asList("Books", "Online Books", "Courses", "Math", "Machine learning", "Inspiration", "Events", "Schools", "Blogs", "Related"));

            for (Element listItem : listItems) {
                Element anchor = listItem.selectFirst("a");
                if (anchor != null) {
                    String href = anchor.attr("href");
                    String description = listItem.text();

                    List<String> scopes = classifyDescription(description);

                    List<String> linkProgrammingLanguages = new ArrayList<>();
                    for (String language : programmingLanguages) {
                        if (description.toLowerCase().contains(language)) {
                            linkProgrammingLanguages.add(language);
                        }
                    }

                    Map<String, List<String>> linkFilters = new HashMap<>();
                    for (Map.Entry<String, List<String>> entry : filters.entrySet()) {
                        List<String> foundFilters = new ArrayList<>();
                        for (String filter : entry.getValue()) {
                            if (description.toLowerCase().contains(filter.toLowerCase())) {
                                foundFilters.add(filter);
                            }
                        }
                        if (!foundFilters.isEmpty()) {
                            linkFilters.put(entry.getKey(), foundFilters);
                        }
                    }

                    links.add(new Link(href, description, scopes, linkProgrammingLanguages, linkFilters));
                }
            }

            Gson gson = new Gson();

            String json = links.stream()
                    .map(gson::toJson)
                    .collect(Collectors.joining(",\n"));

            json = "[" + json + "]";

            FileWriter writer = new FileWriter("links.json");
            writer.write(json);
            writer.close();

            System.out.println("JSON file generated successfully.");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    static List<String> classifyDescription(String description) {
        String[] keywords = {"game", "graphics", "animation", "arduino","web","canvas","3d","2d","algebra","audio","visual","mac","win","math","coding","generative","generation",
                "shader","physics","particle","vector","projects","shepherding","design","code","explain","processing","geometry","ray","artist","music","interactive","framework"};
        List<String> scopes = new ArrayList<>();
        for (String keyword : keywords) {
            if (description.toLowerCase().contains(keyword)) {
                scopes.add(keyword);
            }
        }
        return scopes;
    }

    static class Link {
        String href;
        String description;
        List<String> scopes;
        List<String> programmingLanguages;
        Map<String, List<String>> filters;

        public Link(String href, String description, List<String> scopes, List<String> programmingLanguages, Map<String, List<String>> filters) {
            this.href = href;
            this.description = description;
            this.scopes = scopes;
            this.programmingLanguages = programmingLanguages;
            this.filters = filters;
        }
    }
}

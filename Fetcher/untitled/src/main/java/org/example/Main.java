import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import com.google.gson.Gson;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        try {
            Document doc = Jsoup.connect("https://github.com/terkelg/awesome-creative-coding?tab=readme-ov-file").get();
            Elements listItems = doc.select("li");
            List<Link> links = new ArrayList<>();
            String[] programmingLanguages = {"javascript", "python", "c++", "java", "ruby", "php", "c#", "swift", "kotlin", "rust", "typescript","html","css"};

            for (Element listItem : listItems) {
                Element anchor = listItem.selectFirst("a");
                if (anchor != null) {
                    String href = anchor.attr("href");
                    String description = listItem.text();


                    String scope = classifyDescription(description);


                    String programmingLanguage = "";
                    for (String language : programmingLanguages) {
                        if (description.toLowerCase().contains(language)) {
                            programmingLanguage = language;
                            break;
                        }
                    }

                    links.add(new Link(href, description, scope, programmingLanguage));
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

    static String classifyDescription(String description) {
        String[] keywords = {"game", "graphics", "animation", "arduino","web","canvas","3d","2d","algebra","audio","visual","mac","win","math","coding","generative","generation",
                "shader","physics","particle","vector","projects","shepherding","design","code","explain","processing","geometry","ray","artist","music","interactive"};
        for (String keyword : keywords) {
            if (description.toLowerCase().contains(keyword)) {
                return keyword;
            }
        }
        return "";
    }

    static class Link {
        String href;
        String description;
        String scope;
        String programmingLanguage;

        public Link(String href, String description, String scope, String programmingLanguage) {
            this.href = href;
            this.description = description;
            this.scope = scope;
            this.programmingLanguage = programmingLanguage;
        }
    }
}
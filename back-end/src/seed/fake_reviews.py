from faker.providers import BaseProvider
from src.database.models.reviews import SentimentModelValidation, SENTIMENT_TYPE
from typing import TypedDict, List, OrderedDict



class BaseReviewData(TypedDict):
    content:str
    theme:str

    

class ReviewData(TypedDict):
    content:str
    sentiment:SentimentModelValidation


class ReviewProvider(BaseProvider):
    positive_data: List[BaseReviewData] = [
        {"content": "The steak was cooked to perfection, very juicy.", "theme": "food"},
        {"content": "Our waiter was incredibly attentive and friendly.", "theme": "service"},
        {"content": "Best tiramisu I've ever had, highly recommend.", "theme": "food"},
    ]

    negative_data: List[BaseReviewData] = [
        {"content": "Had to wait 45 minutes for a table despite having a reservation.", "theme": "wait-time"},
        {"content": "The noise level made it hard to have a conversation.", "theme": "ambiance"},
        {"content": "Food arrived cold after a 20-minute wait.", "theme": "wait-time"},
    ]

    neutral_data: List[BaseReviewData] = [
        {"content": "The food was okay, nothing special but edible.", "theme": "food"},
        {"content": "Service was average, neither fast nor slow.", "theme": "service"},
        {"content": "Prices are standard for this area, no surprises.", "theme": "price"},
        {"content": "The place was clean but the decor was a bit dated.", "theme": "ambiance"},
    ]
    _function_weights = OrderedDict([
        ("positive", 60),
        ("negative", 20),
        ("neutral", 5),
        ("mixed", 5)
    ])
    
    def positive_review(self)->ReviewData:
        result = self.random_element(self.positive_data)
        return {
            'content':result["content"],
            'sentiment':SentimentModelValidation(
                positive=[result["theme"]],
                negative=[],
                neutral=[]
                )
                }
    def negative_review(self)->ReviewData:
        result = self.random_element(self.negative_data)
        return {
            'content':result["content"],
            'sentiment':SentimentModelValidation(
                negative=[result["theme"]],
                positive=[],
                neutral=[]
                )
                }
    def neutral_review(self)->ReviewData:
        result = self.random_element(self.neutral_data)
        return {
            'content':result["content"],
            'sentiment':SentimentModelValidation(
                neutral =[result["theme"]],
                positive =[],
                negative =[]
                )
                }
    def mixed_review(self)->ReviewData:
        neg_result = self.random_element(self.negative_data)
        pos_result = self.random_element(self.positive_data)
        return {
            'content':f'{neg_result["content"]}. However. {pos_result['content']}',
            'sentiment':SentimentModelValidation(
                negative = [neg_result["theme"]],
                positive = [pos_result['theme']],
                neutral = []
            )
                }
    def any_review(self)->tuple[SENTIMENT_TYPE,ReviewData]:
        selected_key = self.random_elements(elements=self._function_weights,length=1,use_weighting=True)[0]
        if selected_key == "positive":
            return ("Positive",self.positive_review())
        elif selected_key == "negative":
            return ("Negative",self.negative_review())
        elif selected_key == "neutral":
            return ("Neutral",self.neutral_review())
        else:
            return ("Mixed",self.mixed_review())

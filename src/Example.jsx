import React from "react";
import { TopBlock, Title, MainSection } from "./app.styled";
import Container from "./components/ui/Container";
import Header from "./components/Header";
import ProductsList from "./components/ProductsList";
import Search from "./components/Search";
import ErrorMessage from "./components/ErrorMessage/ErrorMessage";
import debounce from "lodash.debounce";
import { getProducts } from "./api";
import Skeleton from "./components/Skeleton/Skeleton";
import { Button } from "./components/ProductsList/productsList.styled";

const STATUS = {
  IDLE: "idle",
  PENDING: "pending",
  RESOLVED: "resolved",
  REJECTED: "rejected",
};

export default class App extends React.Component {
  state = {
    products: [],
    searchQuery: "",
    status: STATUS.IDLE,
    error: null,
    currentPage: 1,
    totalPages: 0,
    limit: 30,
  };

  componentDidMount() {
    this.fetchProducts();
  }

  componentDidUpdate(_, prevState) {
    const { searchQuery, currentPage } = this.state;
    if (prevState.searchQuery !== searchQuery) {
      this.fetchProducts();
    }
    if (prevState.currentPage !== currentPage) {
      this.fetchProducts();
    }
  }

  fetchProducts = async () => {
    const { searchQuery, limit, currentPage, products } = this.state;
    await this.setState({ status: STATUS.PENDING });
    const skip = (currentPage - 1) * limit;

    try {
      const data = await getProducts({ searchQuery, limit, skip });

      if (!data.products.length) {
        throw new Error("No matches found");
      }

      this.setState({
        products: [...products, ...data.products],
        totalPages: Math.ceil(data.total / limit),
        status: STATUS.RESOLVED,
        error: null
      });
    } catch (error) {
      this.setState({ error: error.message, status: STATUS.REJECTED });
    }
  };

  handleChangeSearchQuery = debounce((searchQuery) => {
    this.setState({
      searchQuery,
      currentPage: 1,
      products: [],
    });
  }, 1000);

  handleLoadMore = () => {
    this.setState((prevState) => ({ currentPage: prevState.currentPage + 1 }));
  };

  render() {
    const { searchQuery, status, products, error, currentPage, totalPages } =
      this.state;
    const showLoadMoreButton =
      products.length !== 0 && currentPage < totalPages;
    return (
      <Container>
        <Header />

        <MainSection>
          <TopBlock>
            <Title>Products</Title>
            <Search
              searchQuery={searchQuery}
              onChange={this.handleChangeSearchQuery}
            />
          </TopBlock>

          {status === STATUS.PENDING && <Skeleton />}

          {status === STATUS.RESOLVED && <ProductsList products={products} />}

          {showLoadMoreButton && (
            <Button
              onClick={this.handleLoadMore}
              disabled={status === STATUS.PENDING ? true : false}
            >
              {status === STATUS.PENDING ? "Loading..." : "Load More"}
            </Button>
          )}

          {status === STATUS.REJECTED && <ErrorMessage>{error}</ErrorMessage>}
        </MainSection>
      </Container>
    );
  }
}
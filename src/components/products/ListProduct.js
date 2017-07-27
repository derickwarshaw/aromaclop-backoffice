import React, { Component } from 'react';
import ReactTable from 'react-table';
import bluebird from 'bluebird';
import { compose, graphql } from 'react-apollo';
import gql from 'graphql-tag';
import _ from 'lodash';
import { MdAdd, MdClose, MdCreate, MdRefresh, MdKeyboardArrowLeft, MdPlaylistAddCheck, MdCheck } from 'react-icons/lib/md';
import Modal from 'react-awesome-modal';

import CreateProduct from './CreateProduct';
import Button from './Button';
import Resume from './Resume';

import './styles/listproduct.css';
import 'react-table/react-table.css';

const filterCaseInsensitive = (filter, row) => {
    const id = filter.pivotId || filter.id;

    return (
        row[id]
            ? String(row[id].toLowerCase()).includes(filter.value.toLowerCase())
            : true
    );
};

class ListProduct extends Component {

    constructor(props) {
        super(props);

        this.state = {
            visible: false,
            resume: {visible: false, messages: []},
            loading: false,
            editable: false,
            edited: {},
        };

        this.handleDelete = this.handleDelete.bind(this);
        this.handleRefresh = this.handleRefresh.bind(this);
        this.closeCreateModal = this.closeCreateModal.bind(this);
        this.openCreateModal = this.openCreateModal.bind(this);
        this.closeResumeModal = this.closeResumeModal.bind(this);
        this.openResumeModal = this.openResumeModal.bind(this);
        this.applyTaxonsChanges = this.applyTaxonsChanges.bind(this);
        this.switchEditMode = this.switchEditMode.bind(this);
    }

    openCreateModal() {
        this.setState({visible: true});
    };

    closeCreateModal() {
        this.setState({visible: false});
    };

    openResumeModal() {
        this.setState({resume: {visible: true}});
    };

    closeResumeModal() {
        this.setState({resume: {visible: false}});
    };

    switchEditMode() {
        this.setState({editable: !this.state.editable, edited: {}});
    }

    async handleDelete(id) {
        await this.props.deleteProduct({ id });
        await this.props.data.refetch();
    };

    async handleRefresh() {
        this.setState({ loading: true });
        await this.props.data.refetch();
        this.setState({ loading: false })
    };

    updateTaxons(productTaxon) {
        this.setState({
            edited: {
                ...this.state.edited,
                [productTaxon.product.id]: {
                    ...this.state.edited[productTaxon.product.id],
                    [productTaxon.id]: {
                        productName: productTaxon.product.name,
                        name: productTaxon.taxon.name,
                        id: productTaxon.id.name,
                        available: this.editedTaxonAvailable(productTaxon)
                            ? !this.editedTaxonAvailable(productTaxon).available
                            : !productTaxon.available
                    }
                }
            }
        })
    }

    editedTaxonAvailable(taxon) {
        return this.state.edited[taxon.product.id] &&
            this.state.edited[taxon.product.id][taxon.id];
    }

    taxonBackgroundColor(taxon) {
        if (this.editedTaxonAvailable(taxon)) {
            return this.editedTaxonAvailable(taxon).available ? '#1abc9c' : '#d3746a';
        }

        return taxon.available ? '#1abc9c' : '#d3746a';
    }

    taxonsUpdatedMessage() {
        const updatedProductsIds = Object.keys(this.state.edited);
        var resumeMessages = [];

        updatedProductsIds.forEach((productId) => {
            const updatedTaxonsIds = Object.keys(this.state.edited[productId]);

            updatedTaxonsIds.forEach((taxonId) => {
                const updatedTaxon = this.state.edited[productId][taxonId];
                resumeMessages.push(updatedTaxon);
            })
        });
        resumeMessages.length && this.setState({ resume: { visible: true, messages: resumeMessages} });
    }

    async applyTaxonsChanges() {
        const updatedProductsIds = Object.keys(this.state.edited);

        this.setState({ loading: true });
        await bluebird.map(updatedProductsIds, (productId) => {
            const updatedTaxonsIds = Object.keys(this.state.edited[productId]);

            return bluebird.map(updatedTaxonsIds, (taxonId) => {
                const { available } = this.state.edited[productId][taxonId];

                return this.props.updateAvailability({ id: taxonId, available });
            });
        });

        this.taxonsUpdatedMessage();
        this.setState({ edited: {}, editable: false, loading: false });
    }

    render() {

    const columns = [
        {
            accessor: 'imageUrl',
            Cell: props => <img alt='product' style={{ height: 60, width: 60 }} src={props.value}/>,
            width: 75,
        },
        {
            Header: 'ID',
            accessor: 'id',
            Cell: props => <p className='Listproduct-cell' style={{ fontWeight: 'bold' }}>{props.value}</p>,
            filterable: true,
            width: 250,
        },
        {
            Header: 'Nom',
            accessor: 'name',
            Cell: props => <p className='Listproduct-cell'>{props.value}</p>,
            filterable: true,
            width: 250,
        },
        {
            Header: 'Marque',
            accessor: 'brand.name',
            Cell: props => <p className='Listproduct-cell'>{props.value}</p>,
            filterable: true,
            width: 250,
        },
        {
            Header: 'Catégorie',
            accessor: 'categories',
            Cell: (props) => (
                <div className="Listproduct-cell-container">
                    {props.original.categories.map((prop, k) => (
                        <span 
                            key={k} 
                            className="Listproduct-vignette"
                        >
                            {prop.name}
                        </span>
                    ))}
                </div> 
            ),
            filterable: false,
        },
        {
            Header: 'Taxons',
            width: 250,
            accessor: 'productTaxons',
            Cell: ({ value: productsTaxons }) => (
                <div className="Listproduct-cell-container">
                {
                    _(productsTaxons)
                        .sortBy(({ taxon }) => {
                            const value = parseInt(taxon.name, 10);

                            return isNaN(value) ? taxon.name : value;
                        })
                        .map((productTaxon, i) => (
                        <span
                            style={{ 
                                backgroundColor: this.taxonBackgroundColor(productTaxon),
                                cursor: this.state.editable && 'pointer',
                            }} 
                            className="Listproduct-vignette"
                            key={i}
                            onClick={() => this.state.editable && this.updateTaxons(productTaxon)}
                        >
                            {productTaxon.taxon.name}
                        </span>
                    ))
                        .value()
                }
                </div>
            )
            ,
            filterable: false,
            sortable: false,
        },
        {
            width: 78,
            Cell: props => (
                <p style={{ textAlign: 'center', margin: 0}}>
                    <span 
                        onClick={() => this.handleDelete(props.row.id)} 
                        className='Listproduct-delete'
                    >
                        <MdClose/>
                    </span>
                </p>
            ),
        },
    ];

    return (
            <div>
                <Modal
                    visible={this.state.visible}
                    width="400"
                    height="620"
                    effect="fadeInUp"
                    onClickAway={() => this.closeCreateModal()}
                >
                    <div className="Listproduct-header-modal">
                        <MdAdd style={{ color: '#F9F9F9', marginRight: 5 }} size={16}/><span className="Listproduct-header-label">Ajout d'un produit</span>
                    </div>
                    <div className="Listproduct-modal">
                        <CreateProduct closeModal={this.closeCreateModal}/>
                    </div>
                </Modal>
                <Modal
                    visible={this.state.resume.visible}
                    width="500"
                    height="500"
                    effect="fadeInUp"
                    onClickAway={() => this.closeResumeModal()}
                >
                    <div className="Listproduct-header-modal">
                         <MdPlaylistAddCheck style={{ color: '#F9F9F9', marginRight: 10 }} size={24}/><span className="Listproduct-header-label">Récapitulatif des modifications</span>
                    </div>
                    <div className="Listproduct-messages">
                        { _.map(this.state.resume.messages, (message, k) => <Resume key={k} data={message}/> )}
                    </div>
                </Modal>
                  {
                      !this.state.editable ?
                        <div style={{ backgroundColor: '#F9F9F9' }} className="Listproduct-buttons">
                            <Button
                              color='#1abc9c'
                              callback={this.handleRefresh}
                              icon={<MdRefresh size={18}/>}
                              label="Rafraichir les produits"
                            />
                            <Button
                              color="#1abc9c"
                              callback={this.openCreateModal}
                              icon={<MdAdd size={18}/>}
                              label="Ajouter un produit"
                            />
                            <Button
                              color="#1abc9c"
                              callback={this.switchEditMode}
                              icon={<MdCreate size={18}/>}
                              label="Entrer en mode édition"
                            />
                        </div>
                      :
                        <div style={{ backgroundColor: '#0f202e' }} className="Listproduct-buttons">
                            <Button
                              color="#cc6155"
                              callback={this.switchEditMode}
                              icon={<MdKeyboardArrowLeft size={18}/>}
                              label="Sortir du mode édition"
                            />
                            <Button
                              color="#1abc9c"
                              callback={this.applyTaxonsChanges}
                              icon={<MdCheck size={18}/>}
                              label="Appliquer les modifications"
                            />
                        </div>
                  }
                <ReactTable
                    loadingText='Rafraichissement des données..'
                    loading={this.state.loading}
                    noDataText='Chargement des données..'
                    className='Listproduct-table -highlight'
                    data={this.props.data.allProducts}
                    columns={columns}
                    defaultFilterMethod={filterCaseInsensitive}
                    style={{
                        height: '91vh'
                    }}
                />
            </div>
        );
    }
}

export const ListAllProductsQuery = gql`query allProducts {
    allProducts {
        id,
        name,
        imageUrl,
        brand { name },
        categories { name },
        productTaxons {
            id
            taxon { name }
            available
            product { id, name }
        }
    }
}`;

const DeleteProductQuery = gql`
    mutation deleteProduct($id: ID!) {
        deleteProduct(id: $id) {
            id
        }
    }
`;

const DeleteProductQueryOptions = {
    props: ({ mutate }) => ({
        deleteProduct: ({ id }) =>
            mutate({
                variables: { id },
            }),
    })
};

const UpdateAvailabilityQuery = gql`
  mutation updateProductTaxons($id: ID!, $available: Boolean) {
      updateProductTaxons(id: $id, available: $available) {
          id
          available
      }
  } 
`;

const UpdateAvailabilityQueryOptions = {
    props: ({ mutate }) => ({
        updateAvailability: ({ id, available }) =>
            mutate({
                variables: { id, available },
            })
    })
};

export default compose(
    graphql(ListAllProductsQuery),
    graphql(DeleteProductQuery, DeleteProductQueryOptions),
    graphql(UpdateAvailabilityQuery, UpdateAvailabilityQueryOptions)
)(ListProduct);
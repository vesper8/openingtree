import React from 'react'
import { createSubObjectWithProperties, getTimeframeSteps } from '../../app/util'
import * as Constants from '../../app/Constants'
import { trackEvent } from '../../app/Analytics'
import Source from './Source'
import User from './User'
import Filters from './Filters'
import Actions from './Actions'
import request from 'request'

export default class PGNLoader extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            playerName: '',
            site: '',
            playerColor: this.props.settings.playerColor,
            isAdvancedFiltersOpen: false,
            isGamesSubsectionOpen: false,
            expandedPanel: 'source',
            notablePlayers:null,
            notableEvents:null,
            files:[],
            pgnUrl:'',
            selectedNotablePlayer:{}
        }
        this.timeframeSteps = getTimeframeSteps()
        this.state[Constants.FILTER_NAME_SELECTED_TIMEFRAME] = [0, this.timeframeSteps.length - 1]
        this.state[Constants.FILTER_NAME_DOWNLOAD_LIMIT] = Constants.MAX_DOWNLOAD_LIMIT
        this.state[Constants.TIME_CONTROL_ULTRA_BULLET] = true
        this.state[Constants.TIME_CONTROL_BULLET] = true
        this.state[Constants.TIME_CONTROL_BLITZ] = true
        this.state[Constants.TIME_CONTROL_RAPID] = true
        this.state[Constants.TIME_CONTROL_CLASSICAL] = true
        this.state[Constants.TIME_CONTROL_CORRESPONDENCE] = true
        this.state[Constants.TIME_CONTROL_DAILY] = true
        this.state[Constants.FILTER_NAME_RATED] = "all"
        this.state[Constants.FILTER_NAME_ELO_RANGE] = [0, Constants.MAX_ELO_RATING]
    }


    advancedFilters() {
        return createSubObjectWithProperties(this.state,
            [Constants.TIME_CONTROL_ULTRA_BULLET, Constants.TIME_CONTROL_BULLET,
            Constants.TIME_CONTROL_BLITZ, Constants.TIME_CONTROL_RAPID,
            Constants.TIME_CONTROL_CORRESPONDENCE, Constants.TIME_CONTROL_DAILY,
            Constants.TIME_CONTROL_CLASSICAL, Constants.FILTER_NAME_RATED,
            Constants.FILTER_NAME_SELECTED_TIMEFRAME, Constants.FILTER_NAME_DOWNLOAD_LIMIT,
            Constants.FILTER_NAME_ELO_RANGE])
    }


    handleExpansionChange(panel) {
        return (event, newExpanded) => {
            this.setState({ expandedPanel: newExpanded ? panel : false });
        };
    }

    playerDetailsChange(playerName, files, pgnUrl, selectedPlayer) {
        this.setState({
            playerName: playerName,
            expandedPanel:'filters',
            files:files,
            pgnUrl:pgnUrl,
            selectedNotablePlayer:selectedPlayer
        })
        trackEvent(Constants.EVENT_CATEGORY_PGN_LOADER, "PlayerNameSaved")
    }
    fetchGOATGames(url, callback){
        request.get(url, (error, response) =>{
            if(error) {
                this.props.showError("Could not fetch player list. Failed to connect to DB.")
                callback([])
                return 
            }
            let gamesDetails
            try{
                gamesDetails = JSON.parse(response.body).players
            } catch (e) {
                console.log(e)
            }
            if(!gamesDetails) {
                this.props.showError("Failed to load games.")
                callback([])
            } else {
                callback(gamesDetails)
            }
        })
    }

    siteChange(event) {
        let newSite = event.target.value
        if(newSite === Constants.SITE_PLAYER_DB && !this.state.notablePlayers) {
            this.fetchGOATGames('https://goatchess.github.io/list.json', (gamesDetails)=>{
                this.setState({notablePlayers:gamesDetails})
            })
        }
        if(newSite === Constants.SITE_EVENT_DB && !this.state.notableEvents) {
            this.fetchGOATGames('https://goatchess.github.io/list.json', (gamesDetails)=>{
                this.setState({notableEvents:gamesDetails})
            })
        }
        this.setState({ site: newSite, expandedPanel:'user'})
        trackEvent(Constants.EVENT_CATEGORY_PGN_LOADER, "ChangeSite", this.state.site)
    }

    filtersChange(filters) {
        this.setState({...filters, expandedPanel:''})
        trackEvent(Constants.EVENT_CATEGORY_PGN_LOADER, "FitlersSaved", this.state.site)
    }

    render() {
        return <div><div className="pgnloadersection">
            <Source expandedPanel={this.state.expandedPanel}
                handleExpansionChange={this.handleExpansionChange('source').bind(this)}
                site={this.state.site} siteChange={this.siteChange.bind(this)}/>
            <User expandedPanel={this.state.expandedPanel} playerName={this.state.playerName}
                handleExpansionChange={this.handleExpansionChange('user').bind(this)} 
                showError={this.props.showError} files={this.state.files} players={this.state.notablePlayers}
                events={this.state.notableEvents} site={this.state.site} playerDetailsChange={this.playerDetailsChange.bind(this)}
                pgnUrl={this.state.pgnUrl} selectedPlayer={this.state.selectedNotablePlayer}/>
            <Filters expandedPanel={this.state.expandedPanel} playerColor={this.state.playerColor}
                handleExpansionChange={this.handleExpansionChange('filters').bind(this)}
                site={this.state.site} advancedFilters={this.advancedFilters()}
                timeframeSteps={this.timeframeSteps} filtersChange={this.filtersChange.bind(this)}/>
            </div>
            <Actions expandedPanel={this.state.expandedPanel} playerColor={this.state.playerColor} files={this.state.files}
                playerName={this.state.playerName} site={this.state.site} advancedFilters={this.advancedFilters()}
                notify={this.props.notify} showError={this.props.showError} onChange={this.props.onChange}
                setDownloading={this.props.setDownloading} clear={this.props.clear} isDownloading={this.props.isDownloading}
                switchToMovesTab={this.props.switchToMovesTab} gamesProcessed={this.props.gamesProcessed} 
                selectedNotablePlayer={this.state.selectedNotablePlayer}/>

        </div>
    }

}